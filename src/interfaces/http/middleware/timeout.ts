import type { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env.js';

export function requestTimeout(req: Request, res: Response, next: NextFunction): void {
  const timeout = env.REQUEST_TIMEOUT_MS;

  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timed out.',
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, timeout);

  res.on('finish', () => clearTimeout(timer));
  next();
}
