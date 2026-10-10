import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'garmentflow_jwt_access_secret_super_secure_key_123',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'garmentflow_jwt_refresh_secret_super_secure_key_456',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  },
};
