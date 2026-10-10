import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ConflictError, AppError } from '../utils/errors';

export const listUsers = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const users = await prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, users);
};

export const createUser = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { name, email, password, role } = req.body;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError('User with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      organizationId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return sendSuccess(res, newUser, 201);
};

export const updateUser = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;
  const { name, role, isActive, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { id, organizationId },
  });

  if (!user) {
    throw new NotFoundError('User not found in your organization');
  }

  // Prevent disabling self or changing own role
  if (user.id === req.user!.userId && isActive === false) {
    throw new AppError('Cannot deactivate your own owner account', 400);
  }

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = isActive;
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return sendSuccess(res, updated);
};

export const deleteUser = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const { id } = req.params;

  if (id === req.user!.userId) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const user = await prisma.user.findFirst({
    where: { id, organizationId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await prisma.user.delete({ where: { id } });

  return sendSuccess(res, { message: 'User deleted successfully' });
};
