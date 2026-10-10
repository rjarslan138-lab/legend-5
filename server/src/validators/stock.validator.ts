import { z } from 'zod';

export const receiveStockSchema = z.object({
  body: z.object({
    variantId: z.string().uuid('Invalid variant ID'),
    locationId: z.string().uuid('Invalid location ID'),
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    reference: z.string().optional().nullable(),
  }),
});

export const transferStockSchema = z.object({
  body: z.object({
    variantId: z.string().uuid('Invalid variant ID'),
    fromLocationId: z.string().uuid('Invalid source location ID'),
    toLocationId: z.string().uuid('Invalid destination location ID'),
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    reference: z.string().optional().nullable(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    variantId: z.string().uuid('Invalid variant ID'),
    locationId: z.string().uuid('Invalid location ID'),
    newQuantity: z.number().int().min(0, 'Adjusted quantity cannot be negative'),
    reason: z.string().min(1, 'Reason for adjustment is required'),
  }),
});

export const damagedStockSchema = z.object({
  body: z.object({
    variantId: z.string().uuid('Invalid variant ID'),
    locationId: z.string().uuid('Invalid location ID'),
    quantity: z.number().int().positive('Damaged quantity must be greater than 0'),
    reason: z.string().min(1, 'Reason or damage note is required'),
  }),
});
