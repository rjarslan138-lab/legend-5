import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  email: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const clearAuthCookies = (res: Response) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', { ...cookieOptions, path: '/' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};
