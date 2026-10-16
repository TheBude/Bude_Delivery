import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import { setupSocketIO } from './socket';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './errors/AppError';
import { HTTP_STATUS } from './constants/http.constants';

const app = express();
const server = http.createServer(app);

// Disable header that leaks server technology
app.disable('x-powered-by');

// Initialize Socket.io
setupSocketIO(server);

// High-performance gzip/deflate compression for all API payloads
app.use(
  compression({
    threshold: 1024, // Compress responses larger than 1KB
    level: 6,
  })
);

// Security & Parsing Middlewares
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Response-time and performance monitoring middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    res.setHeader('X-Response-Time', `${timeMs}ms`);
    if (config.isDevelopment) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${timeMs}ms`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'ok',
    service: 'Bude Delivery API',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// Mount Central API Router
app.use('/api', apiRouter);

// Handle 404 for undefined routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Marshrut topilmadi: ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Graceful server start
server.listen(config.port, () => {
  console.log(`🚀 Bude Delivery Backend Server is running on port ${config.port} (${config.nodeEnv})`);
  console.log(`📡 WebSocket ready on ws://localhost:${config.port}`);
  console.log(`🔗 API Base: http://localhost:${config.port}/api`);
});
