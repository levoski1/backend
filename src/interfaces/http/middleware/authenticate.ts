import type { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../../application/auth/jwt-service.js';
import { AuthenticationError } from '../../../shared/errors/index.js';

const jwtService = new JwtService();

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or invalid authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwtService.verifyAccessToken(token);
    (req as AuthenticatedRequest).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return next(new AuthenticationError('Invalid or expired access token'));
  }
}
