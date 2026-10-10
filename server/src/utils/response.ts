import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    message: string;
    details?: any;
  } | null;
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    error: null,
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  details?: any
): Response => {
  const payload: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
