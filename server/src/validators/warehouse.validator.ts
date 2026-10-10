import { z } from 'zod';

export const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Warehouse name is required'),
    address: z.string().optional(),
  }),
});

export const updateWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
  }),
});

export const createLocationSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Location code is required (e.g. A-03 / Rack 7)'),
    description: z.string().optional(),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    code: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});
