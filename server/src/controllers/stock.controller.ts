import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError, NotFoundError } from '../utils/errors';
import { MovementType } from '@prisma/client';

export const listStock = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { variantId, locationId, warehouseId } = req.query;

  const where: any = {
    variant: { organizationId },
  };

  if (variantId) {
    where.variantId = variantId as string;
  }

  if (locationId) {
    where.locationId = locationId as string;
  }

  if (warehouseId) {
    where.location = { warehouseId: warehouseId as string };
  }

  const stockItems = await prisma.stockItem.findMany({
    where,
    include: {
      variant: {
        include: {
          product: true,
          fabricBatch: true,
        },
      },
      location: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: [
      { variant: { product: { name: 'asc' } } },
      { location: { code: 'asc' } },
    ],
  });

  return sendSuccess(res, stockItems);
};

export const receiveStock = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { variantId, locationId, quantity, reference } = req.body;

  // Validate variant belongs to organization
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId },
    include: { product: true },
  });
  if (!variant) {
    throw new NotFoundError('Product variant not found');
  }

  // Validate location belongs to organization
  const location = await prisma.location.findFirst({
    where: { id: locationId, warehouse: { organizationId } },
  });
  if (!location) {
    throw new NotFoundError('Warehouse location not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Upsert stock item
    const stockItem = await tx.stockItem.upsert({
      where: {
        variantId_locationId: {
          variantId,
          locationId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        variantId,
        locationId,
        quantity,
      },
      include: {
        variant: { include: { product: true } },
        location: { include: { warehouse: true } },
      },
    });

    // Write immutable ledger movement
    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        variantId,
        toLocationId: locationId,
        quantity,
        type: MovementType.RECEIVE,
        reference: reference || 'Manual Stock Intake',
        createdBy: userId,
      },
    });

    return { stockItem, movement };
  });

  return sendSuccess(res, result, 201);
};

export const transferStock = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { variantId, fromLocationId, toLocationId, quantity, reference } = req.body;

  if (fromLocationId === toLocationId) {
    throw new AppError('Source and destination locations cannot be the same', 400);
  }

  // Validate variant
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId },
  });
  if (!variant) {
    throw new NotFoundError('Product variant not found');
  }

  // Validate both locations belong to this organization
  const [fromLoc, toLoc] = await Promise.all([
    prisma.location.findFirst({
      where: { id: fromLocationId, warehouse: { organizationId } },
    }),
    prisma.location.findFirst({
      where: { id: toLocationId, warehouse: { organizationId } },
    }),
  ]);

  if (!fromLoc || !toLoc) {
    throw new NotFoundError('One or both warehouse locations not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Check available source stock
    const sourceStock = await tx.stockItem.findUnique({
      where: {
        variantId_locationId: {
          variantId,
          locationId: fromLocationId,
        },
      },
    });

    if (!sourceStock || sourceStock.quantity < quantity) {
      throw new AppError(
        `Insufficient stock for transfer. Available: ${sourceStock?.quantity || 0}, Requested: ${quantity}`,
        400
      );
    }

    // Deduct from source
    const updatedSource = await tx.stockItem.update({
      where: { id: sourceStock.id },
      data: { quantity: { decrement: quantity } },
    });

    // Add to destination
    const updatedDest = await tx.stockItem.upsert({
      where: {
        variantId_locationId: {
          variantId,
          locationId: toLocationId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        variantId,
        locationId: toLocationId,
        quantity,
      },
    });

    // Log movement in ledger
    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        variantId,
        fromLocationId,
        toLocationId,
        quantity,
        type: MovementType.TRANSFER,
        reference: reference || 'Internal Transfer',
        createdBy: userId,
      },
    });

    return { updatedSource, updatedDest, movement };
  });

  return sendSuccess(res, result);
};

export const adjustStock = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { variantId, locationId, newQuantity, reason } = req.body;

  // Validate
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId },
  });
  if (!variant) {
    throw new NotFoundError('Product variant not found');
  }

  const location = await prisma.location.findFirst({
    where: { id: locationId, warehouse: { organizationId } },
  });
  if (!location) {
    throw new NotFoundError('Location not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.stockItem.findUnique({
      where: {
        variantId_locationId: {
          variantId,
          locationId,
        },
      },
    });

    const currentQty = existing?.quantity || 0;
    const diff = newQuantity - currentQty;

    const stockItem = await tx.stockItem.upsert({
      where: {
        variantId_locationId: {
          variantId,
          locationId,
        },
      },
      update: { quantity: newQuantity },
      create: { variantId, locationId, quantity: newQuantity },
    });

    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        variantId,
        fromLocationId: diff < 0 ? locationId : null,
        toLocationId: diff > 0 ? locationId : null,
        quantity: Math.abs(diff),
        type: MovementType.ADJUSTMENT,
        reference: `Audit Reconciliation: ${reason} (Was: ${currentQty}, Now: ${newQuantity})`,
        createdBy: userId,
      },
    });

    return { stockItem, movement };
  });

  return sendSuccess(res, result);
};

export const recordDamagedStock = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { variantId, locationId, quantity, reason } = req.body;

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId },
  });
  if (!variant) {
    throw new NotFoundError('Product variant not found');
  }

  const location = await prisma.location.findFirst({
    where: { id: locationId, warehouse: { organizationId } },
  });
  if (!location) {
    throw new NotFoundError('Location not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const stockItem = await tx.stockItem.findUnique({
      where: {
        variantId_locationId: {
          variantId,
          locationId,
        },
      },
    });

    if (!stockItem || stockItem.quantity < quantity) {
      throw new AppError(
        `Cannot record damaged goods exceeding current stock. Available: ${stockItem?.quantity || 0}`,
        400
      );
    }

    const updated = await tx.stockItem.update({
      where: { id: stockItem.id },
      data: { quantity: { decrement: quantity } },
    });

    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        variantId,
        fromLocationId: locationId,
        quantity,
        type: MovementType.DAMAGED,
        reference: `Damaged Stock: ${reason}`,
        createdBy: userId,
      },
    });

    return { stockItem: updated, movement };
  });

  return sendSuccess(res, result);
};

export const listMovements = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { type, variantId, page = '1', limit = '30' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
  const skip = (pageNum - 1) * limitNum;

  const where: any = { organizationId };

  if (type) {
    where.type = type as MovementType;
  }

  if (variantId) {
    where.variantId = variantId as string;
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        variant: {
          include: { product: true },
        },
        fromLocation: { include: { warehouse: true } },
        toLocation: { include: { warehouse: true } },
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return sendSuccess(res, {
    movements,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};
