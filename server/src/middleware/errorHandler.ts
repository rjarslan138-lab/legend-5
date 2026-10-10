import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Handle Zod validation error
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, formatted);
  }

  // Handle Prisma unique constraint error
  if (err?.code === 'P2002') {
    const fields = err.meta?.target ? (err.meta.target as string[]).join(', ') : 'field';
    return sendError(res, `Unique constraint violation: ${fields} already exists`, 409);
  }

  // Handle Prisma not found error
  if (err?.code === 'P2025') {
    return sendError(res, err.meta?.cause || 'Record not found', 404);
  }

  // Default internal server error
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : (err.message || 'Internal server error');

  return sendError(res, message, 500);
};
