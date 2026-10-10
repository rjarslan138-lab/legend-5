import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export const traceSku = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { sku } = req.params;

  const variant = await prisma.productVariant.findFirst({
    where: {
      sku: { equals: sku.trim(), mode: 'insensitive' },
      organizationId,
    },
    include: {
      product: true,
      fabricBatch: true,
      stockItems: {
        where: { quantity: { gt: 0 } },
        include: {
          location: {
            include: { warehouse: true },
          },
        },
      },
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          fromLocation: true,
          toLocation: true,
          user: { select: { id: true, name: true, role: true } },
        },
      },
      orderItems: {
        orderBy: { order: { createdAt: 'desc' } },
        take: 20,
        include: {
          order: {
            include: {
              customer: true,
              payments: { orderBy: { receivedAt: 'desc' } },
            },
          },
        },
      },
    },
  });

  if (!variant) {
    throw new NotFoundError(`SKU '${sku}' not found in your organization`);
  }

  // Format response for the "Product 92204" card
  const totalInStock = variant.stockItems.reduce((acc, si) => acc + si.quantity, 0);

  const traceData = {
    variant: {
      id: variant.id,
      sku: variant.sku,
      productName: variant.product.name,
      category: variant.product.category,
      size: variant.size,
      color: variant.color,
      price: variant.price,
      costPrice: variant.costPrice,
      reorderLevel: variant.reorderLevel,
      totalInStock,
    },
    fabricBatch: variant.fabricBatch
      ? {
          id: variant.fabricBatch.id,
          batchCode: variant.fabricBatch.batchCode,
          fabricType: variant.fabricBatch.fabricType,
          color: variant.fabricBatch.color,
          supplier: variant.fabricBatch.supplier,
          rollCount: variant.fabricBatch.rollCount,
          weightKg: variant.fabricBatch.weightKg,
          lengthMeters: variant.fabricBatch.lengthMeters,
          costPerUnit: variant.fabricBatch.costPerUnit,
          wastageKg: variant.fabricBatch.wastageKg,
          receivedAt: variant.fabricBatch.receivedAt,
          notes: variant.fabricBatch.notes,
        }
      : null,
    stockLocations: variant.stockItems.map((si) => ({
      locationId: si.location.id,
      code: si.location.code,
      warehouseName: si.location.warehouse.name,
      quantity: si.quantity,
    })),
    recentMovements: variant.stockMovements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      fromLocation: m.fromLocation ? m.fromLocation.code : null,
      toLocation: m.toLocation ? m.toLocation.code : null,
      reference: m.reference,
      userName: m.user?.name || 'System',
      timestamp: m.createdAt,
    })),
    customerOrders: variant.orderItems.map((oi) => ({
      orderId: oi.order.id,
      orderNo: oi.order.orderNo,
      customerName: oi.order.customer.name,
      customerCity: oi.order.customer.city,
      customerType: oi.order.customer.type,
      orderedQuantity: oi.quantity,
      unitPrice: oi.unitPrice,
      lineTotal: oi.lineTotal,
      orderStatus: oi.order.status,
      paymentStatus: oi.order.paymentStatus,
      orderTotalAmount: oi.order.totalAmount,
      orderPaidAmount: oi.order.paidAmount,
      orderDate: oi.order.createdAt,
      payments: oi.order.payments,
    })),
  };

  return sendSuccess(res, traceData);
};
