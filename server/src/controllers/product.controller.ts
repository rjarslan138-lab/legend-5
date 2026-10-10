import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ConflictError, AppError } from '../utils/errors';

export const listProducts = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { search, category, lowStock, page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const where: any = { organizationId };

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { skuPrefix: { contains: search as string, mode: 'insensitive' } },
      { category: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = { equals: category as string, mode: 'insensitive' };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          include: {
            fabricBatch: true,
            stockItems: {
              include: { location: { include: { warehouse: true } } },
            },
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Format products with computed stock totals per variant and product
  let formatted = products.map((prod) => {
    let totalProdStock = 0;
    const variantsWithStock = prod.variants.map((variant) => {
      const currentStock = variant.stockItems.reduce((sum, item) => sum + item.quantity, 0);
      totalProdStock += currentStock;
      const isLowStock = currentStock <= variant.reorderLevel;
      return {
        ...variant,
        currentStock,
        isLowStock,
      };
    });

    return {
      ...prod,
      totalStock: totalProdStock,
      variants: variantsWithStock,
    };
  });

  if (lowStock === 'true') {
    formatted = formatted.filter((p) => p.variants.some((v) => v.isLowStock));
  }

  return sendSuccess(res, {
    products: formatted,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getProduct = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const product = await prisma.product.findFirst({
    where: { id, organizationId },
    include: {
      variants: {
        include: {
          fabricBatch: true,
          stockItems: {
            include: { location: { include: { warehouse: true } } },
          },
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundError('Product style not found');
  }

  const variants = product.variants.map((v) => {
    const currentStock = v.stockItems.reduce((acc, item) => acc + item.quantity, 0);
    return {
      ...v,
      currentStock,
      isLowStock: currentStock <= v.reorderLevel,
    };
  });

  return sendSuccess(res, { ...product, variants });
};

export const createProduct = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { name, skuPrefix, category, description, basePrice, variants } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        organizationId,
        name,
        skuPrefix,
        category,
        description: description || null,
        basePrice,
      },
    });

    if (variants && Array.isArray(variants) && variants.length > 0) {
      // Check for SKU conflicts
      const skus = variants.map((v) => v.sku);
      const existing = await tx.productVariant.findFirst({
        where: {
          organizationId,
          sku: { in: skus },
        },
      });

      if (existing) {
        throw new ConflictError(`Variant SKU '${existing.sku}' is already in use`);
      }

      for (const variant of variants) {
        await tx.productVariant.create({
          data: {
            organizationId,
            productId: product.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            fabricBatchId: variant.fabricBatchId || null,
            price: variant.price,
            costPrice: variant.costPrice,
            reorderLevel: variant.reorderLevel ?? 20,
          },
        });
      }
    }

    return product;
  });

  const fullProduct = await prisma.product.findUnique({
    where: { id: result.id },
    include: {
      variants: {
        include: { fabricBatch: true, stockItems: true },
      },
    },
  });

  return sendSuccess(res, fullProduct, 201);
};

export const updateProduct = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;
  const { name, skuPrefix, category, description, basePrice } = req.body;

  const existing = await prisma.product.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Product not found');
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(skuPrefix ? { skuPrefix } : {}),
      ...(category ? { category } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(basePrice !== undefined ? { basePrice } : {}),
    },
    include: {
      variants: {
        include: { fabricBatch: true, stockItems: true },
      },
    },
  });

  return sendSuccess(res, updated);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const existing = await prisma.product.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Product not found');
  }

  await prisma.product.delete({ where: { id } });

  return sendSuccess(res, { message: 'Product and associated variants deleted successfully' });
};

// --- Variant specific endpoints ---

export const createVariant = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { productId } = req.params;
  const { sku, size, color, fabricBatchId, price, costPrice, reorderLevel } = req.body;

  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId },
  });

  if (!product) {
    throw new NotFoundError('Product style not found');
  }

  const existingSku = await prisma.productVariant.findFirst({
    where: { organizationId, sku },
  });

  if (existingSku) {
    throw new ConflictError(`Variant SKU '${sku}' already exists`);
  }

  const variant = await prisma.productVariant.create({
    data: {
      organizationId,
      productId,
      sku,
      size,
      color,
      fabricBatchId: fabricBatchId || null,
      price,
      costPrice,
      reorderLevel: reorderLevel ?? 20,
    },
    include: {
      fabricBatch: true,
      stockItems: true,
    },
  });

  return sendSuccess(res, variant, 201);
};

export const updateVariant = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { variantId } = req.params;
  const { sku, size, color, fabricBatchId, price, costPrice, reorderLevel } = req.body;

  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Variant not found');
  }

  if (sku && sku !== existing.sku) {
    const skuConflict = await prisma.productVariant.findFirst({
      where: { organizationId, sku, id: { not: variantId } },
    });
    if (skuConflict) {
      throw new ConflictError(`SKU '${sku}' is already taken`);
    }
  }

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(sku ? { sku } : {}),
      ...(size ? { size } : {}),
      ...(color ? { color } : {}),
      ...(fabricBatchId !== undefined ? { fabricBatchId } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(costPrice !== undefined ? { costPrice } : {}),
      ...(reorderLevel !== undefined ? { reorderLevel } : {}),
    },
    include: { fabricBatch: true, stockItems: true },
  });

  return sendSuccess(res, updated);
};

export const deleteVariant = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { variantId } = req.params;

  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Variant not found');
  }

  await prisma.productVariant.delete({ where: { id: variantId } });

  return sendSuccess(res, { message: 'Variant deleted successfully' });
};
