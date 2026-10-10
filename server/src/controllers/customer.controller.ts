import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export const listCustomers = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { search, type, city, page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const where: any = { organizationId };

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string, mode: 'insensitive' } },
      { city: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (type) {
    where.type = type;
  }

  if (city) {
    where.city = { equals: city as string, mode: 'insensitive' };
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  // Compute ledger metrics per customer
  const enriched = customers.map((c) => {
    // Only calculate billed from non-cancelled orders
    const validOrders = c.orders.filter((o) => o.status !== 'CANCELLED');
    const totalBilled = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaid = validOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const outstanding = Math.max(0, totalBilled - totalPaid);

    return {
      id: c.id,
      name: c.name,
      type: c.type,
      phone: c.phone,
      city: c.city,
      address: c.address,
      creditLimit: c.creditLimit,
      notes: c.notes,
      createdAt: c.createdAt,
      orderCount: validOrders.length,
      totalBilled,
      totalPaid,
      outstanding,
    };
  });

  return sendSuccess(res, {
    customers: enriched,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getCustomer = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
            },
          },
          payments: {
            orderBy: { receivedAt: 'desc' },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const validOrders = customer.orders.filter((o) => o.status !== 'CANCELLED');
  const totalBilled = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = validOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const outstanding = Math.max(0, totalBilled - totalPaid);

  return sendSuccess(res, {
    ...customer,
    totalBilled,
    totalPaid,
    outstanding,
  });
};

export const createCustomer = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { name, type, phone, city, address, creditLimit, notes } = req.body;

  const customer = await prisma.customer.create({
    data: {
      organizationId,
      name,
      type: type || 'SHOP',
      phone,
      city,
      address: address || null,
      creditLimit: creditLimit ?? 100000,
      notes: notes || null,
    },
  });

  return sendSuccess(res, customer, 201);
};

export const updateCustomer = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const existing = await prisma.customer.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Customer not found');
  }

  const { name, type, phone, city, address, creditLimit, notes } = req.body;

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(type ? { type } : {}),
      ...(phone ? { phone } : {}),
      ...(city ? { city } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(creditLimit !== undefined ? { creditLimit } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return sendSuccess(res, updated);
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  const existing = await prisma.customer.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new NotFoundError('Customer not found');
  }

  await prisma.customer.delete({ where: { id } });

  return sendSuccess(res, { message: 'Customer deleted successfully' });
};
