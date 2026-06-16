import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../../../shared/errors/AppError.js';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      next(new ValidationError('Validation failed', { fields: fieldErrors }));
      return;
    }

    req[target] = result.data;
    next();
  };
}
