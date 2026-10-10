import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { config } from './config';
import { setupSocketIO } from './socket';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './errors/AppError';
import { HTTP_STATUS } from './constants/http.constants';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
setupSocketIO(server);

// Security & Parsing Middlewares
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging in development
if (config.isDevelopment) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

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
