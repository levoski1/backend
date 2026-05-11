import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../../../shared/logging/logger.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      userId?: string;
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('x-request-id', req.requestId);

  const start = performance.now();

  res.on('finish', () => {
    const duration = performance.now() - start;
    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Math.round(duration),
      },
      'request completed',
    );
  });

  next();
}
