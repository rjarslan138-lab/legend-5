import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export const listWarehouses = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId },
    include: {
      locations: {
        include: {
          stockItems: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return sendSuccess(res, warehouses);
};

export const getWarehouse = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const warehouse = await prisma.warehouse.findFirst({
    where: { id, organizationId },
    include: {
      locations: {
        include: {
          stockItems: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  if (!warehouse) {
    throw new NotFoundError('Warehouse not found');
  }

  return sendSuccess(res, warehouse);
};

export const createWarehouse = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { name, address } = req.body;

  const warehouse = await prisma.warehouse.create({
    data: {
      organizationId,
      name,
      address,
    },
    include: { locations: true },
  });

  return sendSuccess(res, warehouse, 201);
};

export const updateWarehouse = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;
  const { name, address } = req.body;

  const existing = await prisma.warehouse.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Warehouse not found');
  }

  const updated = await prisma.warehouse.update({
    where: { id },
    data: { name, address },
    include: { locations: true },
  });

  return sendSuccess(res, updated);
};

export const deleteWarehouse = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const existing = await prisma.warehouse.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Warehouse not found');
  }

  await prisma.warehouse.delete({ where: { id } });

  return sendSuccess(res, { message: 'Warehouse deleted successfully' });
};

// --- Locations ---

export const listLocations = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { warehouseId } = req.params;

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, organizationId },
  });

  if (!warehouse) {
    throw new NotFoundError('Warehouse not found');
  }

  const locations = await prisma.location.findMany({
    where: { warehouseId },
    include: {
      stockItems: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
    orderBy: { code: 'asc' },
  });

  return sendSuccess(res, locations);
};

export const createLocation = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { warehouseId } = req.params;
  const { code, description } = req.body;

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, organizationId },
  });

  if (!warehouse) {
    throw new NotFoundError('Warehouse not found');
  }

  const location = await prisma.location.create({
    data: {
      warehouseId,
      code,
      description,
    },
  });

  return sendSuccess(res, location, 201);
};

export const updateLocation = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { warehouseId, locationId } = req.params;
  const { code, description } = req.body;

  const location = await prisma.location.findFirst({
    where: {
      id: locationId,
      warehouseId,
      warehouse: { organizationId },
    },
  });

  if (!location) {
    throw new NotFoundError('Location not found in warehouse');
  }

  const updated = await prisma.location.update({
    where: { id: locationId },
    data: { code, description },
  });

  return sendSuccess(res, updated);
};

export const deleteLocation = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { warehouseId, locationId } = req.params;

  const location = await prisma.location.findFirst({
    where: {
      id: locationId,
      warehouseId,
      warehouse: { organizationId },
    },
  });

  if (!location) {
    throw new NotFoundError('Location not found in warehouse');
  }

  await prisma.location.delete({ where: { id: locationId } });

  return sendSuccess(res, { message: 'Location deleted successfully' });
};
