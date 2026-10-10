import { HTTP_STATUS, HttpStatusCode } from '../constants/http.constants';

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Avtorizatsiya talab qilinadi', details?: unknown) {
    super(message, HTTP_STATUS.UNAUTHORIZED, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Ushbu amalni bajarish uchun ruxsat berilmagan', details?: unknown) {
    super(message, HTTP_STATUS.FORBIDDEN, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ma\'lumot topilmadi', details?: unknown) {
    super(message, HTTP_STATUS.NOT_FOUND, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.CONFLICT, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, details);
  }
}
