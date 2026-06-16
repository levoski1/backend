import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError.js';
import { logger } from '../../../shared/logging/logger.js';

export class ErrorHandler {
  static handle(err: Error, req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof AppError) {
      logger.warn(
        {
          code: err.code,
          statusCode: err.statusCode,
          requestId: req.requestId,
          details: err.details,
        },
        err.message,
      );

      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details && { details: err.details }),
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    logger.error(
      {
        err,
        requestId: req.requestId,
      },
      'Unhandled error',
    );

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
