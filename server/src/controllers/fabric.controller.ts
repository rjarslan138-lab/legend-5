import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ConflictError } from '../utils/errors';

export const listFabricBatches = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const {
    search,
    fabricType,
    color,
    supplier,
    startDate,
    endDate,
    page = '1',
    limit = '20',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where: any = { organizationId };

  if (search) {
    where.OR = [
      { batchCode: { contains: search as string, mode: 'insensitive' } },
      { fabricType: { contains: search as string, mode: 'insensitive' } },
      { color: { contains: search as string, mode: 'insensitive' } },
      { supplier: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (fabricType) {
    where.fabricType = { equals: fabricType as string, mode: 'insensitive' };
  }

  if (color) {
    where.color = { equals: color as string, mode: 'insensitive' };
  }

  if (supplier) {
    where.supplier = { equals: supplier as string, mode: 'insensitive' };
  }

  if (startDate || endDate) {
    where.receivedAt = {};
    if (startDate) where.receivedAt.gte = new Date(startDate as string);
    if (endDate) where.receivedAt.lte = new Date(endDate as string);
  }

  const [batches, totalCount] = await Promise.all([
    prisma.fabricBatch.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { receivedAt: 'desc' },
      include: {
        _count: {
          select: { variants: true },
        },
      },
    }),
    prisma.fabricBatch.count({ where }),
  ]);

  // Calculate summary totals across the organization (or filtered set)
  const allOrgBatches = await prisma.fabricBatch.findMany({
    where: { organizationId },
    select: {
      weightKg: true,
      wastageKg: true,
      lengthMeters: true,
      costPerUnit: true,
    },
  });

  const summary = allOrgBatches.reduce(
    (acc, batch) => {
      const netWeight = Math.max(0, batch.weightKg - batch.wastageKg);
      acc.totalNetWeightKg += netWeight;
      acc.totalWastageKg += batch.wastageKg;
      acc.totalLengthMeters += batch.lengthMeters || 0;
      acc.totalValuePkr += batch.weightKg * batch.costPerUnit;
      return acc;
    },
    { totalNetWeightKg: 0, totalWastageKg: 0, totalLengthMeters: 0, totalValuePkr: 0 }
  );

  return sendSuccess(res, {
    batches,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    },
    summary,
  });
};

export const getFabricBatch = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const batch = await prisma.fabricBatch.findFirst({
    where: { id, organizationId },
    include: {
      variants: {
        include: {
          product: true,
          stockItems: {
            include: { location: true },
          },
        },
      },
    },
  });

  if (!batch) {
    throw new NotFoundError('Fabric batch not found');
  }

  return sendSuccess(res, batch);
};

export const createFabricBatch = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const {
    batchCode,
    fabricType,
    color,
    supplier,
    rollCount,
    weightKg,
    lengthMeters,
    costPerUnit,
    receivedAt,
    wastageKg,
    notes,
  } = req.body;

  // Check unique batchCode in org
  const existing = await prisma.fabricBatch.findFirst({
    where: { organizationId, batchCode },
  });

  if (existing) {
    throw new ConflictError(`Batch code '${batchCode}' already exists in your organization`);
  }

  const batch = await prisma.fabricBatch.create({
    data: {
      organizationId,
      batchCode,
      fabricType,
      color,
      supplier,
      rollCount: rollCount || 1,
      weightKg,
      lengthMeters: lengthMeters || null,
      costPerUnit,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      wastageKg: wastageKg || 0,
      notes: notes || null,
    },
  });

  return sendSuccess(res, batch, 201);
};

export const updateFabricBatch = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const existing = await prisma.fabricBatch.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Fabric batch not found');
  }

  const {
    batchCode,
    fabricType,
    color,
    supplier,
    rollCount,
    weightKg,
    lengthMeters,
    costPerUnit,
    receivedAt,
    wastageKg,
    notes,
  } = req.body;

  if (batchCode && batchCode !== existing.batchCode) {
    const duplicate = await prisma.fabricBatch.findFirst({
      where: { organizationId, batchCode, id: { not: id } },
    });
    if (duplicate) {
      throw new ConflictError(`Batch code '${batchCode}' already exists`);
    }
  }

  const updated = await prisma.fabricBatch.update({
    where: { id },
    data: {
      ...(batchCode ? { batchCode } : {}),
      ...(fabricType ? { fabricType } : {}),
      ...(color ? { color } : {}),
      ...(supplier ? { supplier } : {}),
      ...(rollCount !== undefined ? { rollCount } : {}),
      ...(weightKg !== undefined ? { weightKg } : {}),
      ...(lengthMeters !== undefined ? { lengthMeters } : {}),
      ...(costPerUnit !== undefined ? { costPerUnit } : {}),
      ...(receivedAt ? { receivedAt: new Date(receivedAt) } : {}),
      ...(wastageKg !== undefined ? { wastageKg } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return sendSuccess(res, updated);
};

export const deleteFabricBatch = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const existing = await prisma.fabricBatch.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Fabric batch not found');
  }

  await prisma.fabricBatch.delete({ where: { id } });

  return sendSuccess(res, { message: 'Fabric batch deleted successfully' });
};
