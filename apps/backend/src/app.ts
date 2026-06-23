import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';

// Routers
import authRouter from './modules/auth/auth.routes';
import brandsRouter from './modules/brands/brands.routes';
import categoriesRouter from './modules/categories/categories.routes';
import storesRouter from './modules/stores/stores.routes';
import productsRouter from './modules/products/products.routes';
import ordersRouter from './modules/orders/orders.routes';
import receiptsRouter from './modules/receipts/receipts.routes';
import ledgerRouter from './modules/ledger/ledger.routes';
import stockReportsRouter from './modules/stock-reports/stockReport.routes';
import userLogsRouter from './modules/user-logs/userLogs.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import uploadRouter from './modules/upload/upload.routes';
import paymentMethodsRouter from './modules/payment-methods/paymentMethods.routes';
import usersRouter from './modules/users/users.routes';

const app = express();

// Trust reverse proxy headers in production (X-Forwarded-* for HTTPS/host).
app.set('trust proxy', 1);

// Security
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const backendUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', backendUrl],
        connectSrc: ["'self'", backendUrl],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
  })
);
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // Increased for development
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve uploaded files — allow cross-origin access so the frontend can load images
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.resolve(uploadDir)));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/stores', storesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/stock-reports', stockReportsRouter);
app.use('/api/user-logs', userLogsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/payment-methods', paymentMethodsRouter);
app.use('/api/users', usersRouter);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
