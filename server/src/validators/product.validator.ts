import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product style name is required'),
    skuPrefix: z.string().min(2, 'SKU prefix is required (e.g. KFH)'),
    category: z.string().min(1, 'Category is required (e.g. Kids, Men, Women)'),
    description: z.string().optional().nullable(),
    basePrice: z.number().positive('Base price must be greater than 0'),
    // Optional variants array for matrix creation at once
    variants: z
      .array(
        z.object({
          sku: z.string().min(1, 'SKU is required'),
          size: z.string().min(1, 'Size is required'),
          color: z.string().min(1, 'Color is required'),
          fabricBatchId: z.string().optional().nullable(),
          price: z.number().positive(),
          costPrice: z.number().positive(),
          reorderLevel: z.number().int().min(0).default(20),
        })
      )
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    skuPrefix: z.string().min(2).optional(),
    category: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    basePrice: z.number().positive().optional(),
  }),
});

export const createVariantSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required'),
    size: z.string().min(1, 'Size is required'),
    color: z.string().min(1, 'Color is required'),
    fabricBatchId: z.string().optional().nullable(),
    price: z.number().positive('Price must be greater than 0'),
    costPrice: z.number().positive('Cost price must be greater than 0'),
    reorderLevel: z.number().int().min(0).default(20),
  }),
});

export const updateVariantSchema = z.object({
  body: z.object({
    sku: z.string().min(1).optional(),
    size: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    fabricBatchId: z.string().optional().nullable(),
    price: z.number().positive().optional(),
    costPrice: z.number().positive().optional(),
    reorderLevel: z.number().int().min(0).optional(),
  }),
});
