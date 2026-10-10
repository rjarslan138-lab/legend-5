import { z } from 'zod';
import { CustomerType } from '@prisma/client';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name is required'),
    type: z.nativeEnum(CustomerType).default(CustomerType.SHOP),
    phone: z.string().min(5, 'Phone number is required'),
    city: z.string().min(2, 'City is required'),
    address: z.string().optional().nullable(),
    creditLimit: z.number().min(0).default(100000),
    notes: z.string().optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    type: z.nativeEnum(CustomerType).optional(),
    phone: z.string().min(5).optional(),
    city: z.string().min(2).optional(),
    address: z.string().optional().nullable(),
    creditLimit: z.number().min(0).optional(),
    notes: z.string().optional().nullable(),
  }),
});
