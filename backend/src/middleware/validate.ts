import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

export interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schema: ZodSchema | ValidationTargets) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('safeParse' in schema) {
        // Direct body schema
        const result = schema.safeParse(req.body);
        if (!result.success) {
          const firstMessage = result.error.issues?.[0]?.message || 'Ma\'lumotlar noto\'g\'ri formatda';
          throw new ValidationError(firstMessage, result.error.issues);
        }
        req.body = result.data;
      } else {
        // Multi-target schema: body, query, params
        const targets = schema as ValidationTargets;

        if (targets.body) {
          const result = targets.body.safeParse(req.body);
          if (!result.success) {
            const firstMessage = result.error.issues?.[0]?.message || 'So\'rov tanasida xatolik';
            throw new ValidationError(firstMessage, result.error.issues);
          }
          req.body = result.data;
        }

        if (targets.query) {
          const result = targets.query.safeParse(req.query);
          if (!result.success) {
            const firstMessage = result.error.issues?.[0]?.message || 'Qidiruv parametrlarida xatolik';
            throw new ValidationError(firstMessage, result.error.issues);
          }
          req.query = result.data as any;
        }

        if (targets.params) {
          const result = targets.params.safeParse(req.params);
          if (!result.success) {
            const firstMessage = result.error.issues?.[0]?.message || 'URL parametrlarida xatolik';
            throw new ValidationError(firstMessage, result.error.issues);
          }
          req.params = result.data as any;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
