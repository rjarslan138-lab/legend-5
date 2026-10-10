import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateTokens, setAuthCookies, clearAuthCookies, verifyRefreshToken } from '../utils/token';
import { sendSuccess, sendError } from '../utils/response';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { UserRole } from '@prisma/client';

export const register = async (req: Request, res: Response) => {
  const { organizationName, name, email, password } = req.body;

  // Check if email already registered
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('A user with this email address already exists');
  }

  // Hash password with salt rounds 12
  const passwordHash = await bcrypt.hash(password, 12);

  // Create organization and owner in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: organizationName,
      },
    });

    const user = await tx.user.create({
      data: {
        organizationId: org.id,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: UserRole.OWNER,
      },
    });

    // Create default warehouse and locations for quick start
    const defaultWarehouse = await tx.warehouse.create({
      data: {
        organizationId: org.id,
        name: 'Main Factory Warehouse',
        address: 'Faisalabad Industrial Area',
      },
    });

    await tx.location.createMany({
      data: [
        { warehouseId: defaultWarehouse.id, code: 'A-01 / Rack 1', description: 'Raw Fabric & Rolls' },
        { warehouseId: defaultWarehouse.id, code: 'A-02 / Rack 2', description: 'Cutting & WIP Stock' },
        { warehouseId: defaultWarehouse.id, code: 'A-03 / Rack 7', description: 'Finished Goods / Dispatch' },
      ],
    });

    return { org, user };
  });

  const { accessToken, refreshToken } = generateTokens({
    userId: result.user.id,
    organizationId: result.org.id,
    role: result.user.role,
    email: result.user.email,
  });

  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(
    res,
    {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        organizationId: result.org.id,
        organizationName: result.org.name,
        plan: result.org.plan,
      },
      accessToken,
    },
    201
  );
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    email: user.email,
  });

  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      plan: user.organization.plan,
    },
    accessToken,
  });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new UnauthorizedError('Refresh token missing');
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or disabled');
    }

    const tokens = generateTokens({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        plan: user.organization.plan,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    clearAuthCookies(res);
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

export const logout = async (req: Request, res: Response) => {
  clearAuthCookies(res);
  return sendSuccess(res, { message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { organization: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return sendSuccess(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
    plan: user.organization.plan,
  });
};
