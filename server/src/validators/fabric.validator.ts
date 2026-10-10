import { z } from 'zod';

export const createFabricBatchSchema = z.object({
  body: z.object({
    batchCode: z.string().min(1, 'Batch code is required (e.g. B-2409)'),
    fabricType: z.string().min(1, 'Fabric type is required (e.g. Cotton Terry, Fleece)'),
    color: z.string().min(1, 'Color is required (e.g. Navy Blue)'),
    supplier: z.string().min(1, 'Supplier is required (e.g. Kohinoor Mills)'),
    rollCount: z.number().int().min(1).default(1),
    weightKg: z.number().positive('Weight in kg must be greater than 0'),
    lengthMeters: z.number().positive().optional().nullable(),
    costPerUnit: z.number().positive('Cost per unit (PKR) must be greater than 0'),
    receivedAt: z.string().optional(),
    wastageKg: z.number().min(0).default(0),
    notes: z.string().optional().nullable(),
  }),
});

export const updateFabricBatchSchema = z.object({
  body: z.object({
    batchCode: z.string().min(1).optional(),
    fabricType: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    supplier: z.string().min(1).optional(),
    rollCount: z.number().int().min(1).optional(),
    weightKg: z.number().positive().optional(),
    lengthMeters: z.number().positive().optional().nullable(),
    costPerUnit: z.number().positive().optional(),
    receivedAt: z.string().optional(),
    wastageKg: z.number().min(0).optional(),
    notes: z.string().optional().nullable(),
  }),
});
