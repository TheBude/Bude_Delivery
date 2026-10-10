import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthTokenPayload, Role } from '../types';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Avtorizatsiya talab qilinadi (No token provided)');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    throw new UnauthorizedError('Yaroqsiz yoki muddati o\'tgan token (Invalid token)');
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Avtorizatsiya talab qilinadi');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Ruxsat berilmagan. Ushbu amal faqat quyidagi rollar uchun: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}
