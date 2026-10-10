import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { verifyAccessToken } from '../utils/token';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Check cookies first, then fallback to Authorization header
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Access token expired'));
    } else if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid authentication token'));
    }
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Action requires one of the following roles: [${roles.join(', ')}]. Your role is ${req.user.role}`
        )
      );
    }

    next();
  };
};
