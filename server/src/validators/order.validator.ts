import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Customer ID must be a valid UUID'),
    deliveryDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          variantId: z.string().uuid('Variant ID must be a valid UUID'),
          quantity: z.number().int().positive('Quantity must be greater than 0'),
          unitPrice: z.number().positive('Unit price must be greater than 0'),
        })
      )
      .min(1, 'Order must contain at least one item'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Payment amount must be greater than 0'),
    method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
    receivedAt: z.string().optional(),
    note: z.string().optional().nullable(),
  }),
});
