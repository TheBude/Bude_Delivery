import express from 'express';
import http from 'http';
import cors from 'cors';
import { config } from './config';
import { setupSocketIO } from './socket';
import { authRouter } from './routes/authRoutes';
import { supplierRouter } from './routes/supplierRoutes';
import { productRouter } from './routes/productRoutes';
import { orderRouter } from './routes/orderRoutes';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
setupSocketIO(server);

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Bude Delivery API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: 'Ichki server xatoligi yuz berdi',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

server.listen(config.port, () => {
  console.log(`🚀 Bude Delivery Backend Server is running on port ${config.port}`);
  console.log(`📡 WebSocket ready on ws://localhost:${config.port}`);
  console.log(`🔗 API Base: http://localhost:${config.port}/api`);
});
