import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { config } from '../config';
import { HTTP_STATUS } from '../constants/http.constants';

export function errorHandler(
  err: Error | AppError | ZodError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handled AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(config.isDevelopment && err.details ? { details: err.details } : {}),
    });
    return;
  }

  // 2. Direct ZodError
  if (err instanceof ZodError) {
    const errorMsg = err.issues?.[0]?.message || 'Ma\'lumotlar noto\'g\'ri formatda';
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: errorMsg,
      ...(config.isDevelopment ? { details: err.issues } : {}),
    });
    return;
  }

  // 3. JSON body parser error (malformed JSON)
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Noto\'g\'ri JSON formati yuborildi',
    });
    return;
  }

  // 4. Unhandled server error
  console.error(`[Unhandled Error] [${req.method} ${req.url}]:`, err);

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: 'Ichki server xatoligi yuz berdi',
    ...(config.isDevelopment ? { details: err.message || String(err) } : {}),
  });
}
