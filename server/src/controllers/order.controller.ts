import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AppError, NotFoundError } from '../utils/errors';
import { MovementType, OrderStatus, PaymentStatus } from '@prisma/client';

export const listOrders = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { status, paymentStatus, customerId, search, startDate, endDate, page = '1', limit = '30' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
  const skip = (pageNum - 1) * limitNum;

  const where: any = { organizationId };

  if (status) {
    where.status = status as OrderStatus;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus as PaymentStatus;
  }

  if (customerId) {
    where.customerId = customerId as string;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  if (search) {
    where.OR = [
      { orderNo: { contains: search as string, mode: 'insensitive' } },
      { customer: { name: { contains: search as string, mode: 'insensitive' } } },
      { customer: { phone: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
        payments: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return sendSuccess(res, {
    orders,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getOrder = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id, organizationId },
    include: {
      customer: true,
      user: { select: { id: true, name: true, role: true } },
      items: {
        include: {
          variant: {
            include: {
              product: true,
              fabricBatch: true,
              stockItems: { include: { location: true } },
            },
          },
        },
      },
      payments: {
        orderBy: { receivedAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return sendSuccess(res, order);
};

export const createOrder = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { customerId, deliveryDate, notes, items } = req.body;

  // Verify customer
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId },
  });
  if (!customer) {
    throw new NotFoundError('Customer not found in your organization');
  }

  // Calculate totals and verify variants
  let totalAmount = 0;
  const preparedItems: { variantId: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];

  for (const item of items) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: item.variantId, organizationId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundError(`Variant ${item.variantId} not found`);
    }

    const lineTotal = item.quantity * item.unitPrice;
    totalAmount += lineTotal;

    preparedItems.push({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal,
    });
  }

  // Generate order number in sequence
  const result = await prisma.$transaction(async (tx) => {
    const lastOrder = await tx.order.findFirst({
      where: { organizationId },
      orderBy: { orderSeq: 'desc' },
    });

    const nextSeq = (lastOrder?.orderSeq || 1840) + 1;
    const prefix = customer.type === 'SHOP' ? 'SHOP' : 'WHL';
    const orderNo = `${prefix}-${nextSeq}`;

    const newOrder = await tx.order.create({
      data: {
        organizationId,
        orderNo,
        orderSeq: nextSeq,
        customerId,
        status: OrderStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount,
        paidAmount: 0,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        createdBy: userId,
        notes: notes || null,
        items: {
          create: preparedItems,
        },
      },
      include: {
        customer: true,
        items: {
          include: { variant: { include: { product: true } } },
        },
      },
    });

    return newOrder;
  });

  return sendSuccess(res, result, 201);
};

export const confirmOrder = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id, organizationId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              stockItems: {
                where: { quantity: { gt: 0 } },
                orderBy: { quantity: 'desc' },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status !== OrderStatus.DRAFT) {
    throw new AppError(`Order cannot be confirmed because it is already in ${order.status} state`, 400);
  }

  // Atomic transaction to check and deduct stock
  const updatedOrder = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const totalAvailable = item.variant.stockItems.reduce((sum, si) => sum + si.quantity, 0);

      if (totalAvailable < item.quantity) {
        throw new AppError(
          `Insufficient stock for SKU '${item.variant.sku}'. Required: ${item.quantity}, Available: ${totalAvailable}`,
          400
        );
      }

      // Deduct from locations (FIFO/highest stock first)
      let remainingToDeduct = item.quantity;
      for (const stockItem of item.variant.stockItems) {
        if (remainingToDeduct <= 0) break;

        const deductQty = Math.min(stockItem.quantity, remainingToDeduct);

        await tx.stockItem.update({
          where: { id: stockItem.id },
          data: { quantity: { decrement: deductQty } },
        });

        await tx.stockMovement.create({
          data: {
            organizationId,
            variantId: item.variantId,
            fromLocationId: stockItem.locationId,
            quantity: deductQty,
            type: MovementType.SALE,
            reference: `Order ${order.orderNo}`,
            createdBy: userId,
          },
        });

        remainingToDeduct -= deductQty;
      }
    }

    return await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CONFIRMED },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
        payments: true,
      },
    });
  });

  return sendSuccess(res, updatedOrder);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;
  const { status } = req.body;

  const order = await prisma.order.findFirst({
    where: { id, organizationId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new AppError('Cannot update status of a cancelled order', 400);
  }

  if (status === OrderStatus.CANCELLED) {
    throw new AppError('Use the cancel endpoint to properly restore reserved stock', 400);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      customer: true,
      items: { include: { variant: true } },
      payments: true,
    },
  });

  return sendSuccess(res, updated);
};

export const cancelOrder = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const userId = req.user!.userId;
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id, organizationId },
    include: {
      items: {
        include: { variant: true },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new AppError('Order is already cancelled', 400);
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    // If order had already deducted stock (CONFIRMED, PACKED, DISPATCHED), restore it
    if (order.status !== OrderStatus.DRAFT) {
      // Find a default warehouse location to return to
      const defaultLoc = await tx.location.findFirst({
        where: { warehouse: { organizationId } },
      });

      for (const item of order.items) {
        if (defaultLoc) {
          await tx.stockItem.upsert({
            where: {
              variantId_locationId: {
                variantId: item.variantId,
                locationId: defaultLoc.id,
              },
            },
            update: { quantity: { increment: item.quantity } },
            create: {
              variantId: item.variantId,
              locationId: defaultLoc.id,
              quantity: item.quantity,
            },
          });

          await tx.stockMovement.create({
            data: {
              organizationId,
              variantId: item.variantId,
              toLocationId: defaultLoc.id,
              quantity: item.quantity,
              type: MovementType.RETURN,
              reference: `Order ${order.orderNo} Cancelled Restock`,
              createdBy: userId,
            },
          });
        }
      }
    }

    return await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
      include: {
        customer: true,
        items: { include: { variant: true } },
        payments: true,
      },
    });
  });

  return sendSuccess(res, updatedOrder);
};

export const recordPayment = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;
  const { amount, method, receivedAt, note } = req.body;

  const order = await prisma.order.findFirst({
    where: { id, organizationId },
    include: { payments: true },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new AppError('Cannot record payment for a cancelled order', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Record payment
    const payment = await tx.payment.create({
      data: {
        organizationId,
        orderId: order.id,
        amount,
        method: method || 'CASH',
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        note: note || null,
      },
    });

    // Recompute total paid
    const allPayments = await tx.payment.findMany({
      where: { orderId: order.id },
    });

    const newPaidAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);

    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    if (newPaidAmount >= order.totalAmount) {
      paymentStatus = PaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
      paymentStatus = PaymentStatus.PARTIAL;
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
      },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
        payments: { orderBy: { receivedAt: 'desc' } },
      },
    });

    return { payment, order: updatedOrder };
  });

  return sendSuccess(res, result, 201);
};
