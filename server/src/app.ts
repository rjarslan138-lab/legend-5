import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Import route modules
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import warehouseRoutes from './routes/warehouse.routes';
import fabricRoutes from './routes/fabric.routes';
import productRoutes from './routes/product.routes';
import stockRoutes from './routes/stock.routes';
import customerRoutes from './routes/customer.routes';
import orderRoutes from './routes/order.routes';
import traceRoutes from './routes/trace.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app: Application = express();

// Security and standard middlewares
app.use(helmet());
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API Rate Limiter
app.use('/api', apiRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// REST API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/inventory', fabricRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/trace', traceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
