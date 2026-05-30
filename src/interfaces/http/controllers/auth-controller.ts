import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import type { User } from '../../../domain/index.js';
import { AuthService } from '../../../application/auth/auth-service.js';
import { asyncHandler } from '../../../shared/utils/index.js';
import { AuthenticationError } from '../../../shared/errors/index.js';

const authService = new AuthService();

function sanitizeUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email.getValue(),
    authProvider: user.authProvider,
    accountStatus: user.accountStatus,
    emailVerified: user.emailVerified,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  const { user, tokens } = await authService.register({ fullName, email, password });

  res.status(201).json({
    success: true,
    data: {
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, async (err: Error | null, passportUser: Express.User | false, info: { message?: string } | undefined) => {
    if (err) {
      return next(err);
    }

    if (!passportUser) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: info?.message ?? 'Invalid email or password',
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const user = passportUser as unknown as User;

    try {
      const { tokens } = await authService.login(user.email.getValue(), req.body.password);
      res.status(200).json({
        success: true,
        data: {
          user: sanitizeUser(user),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
};

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token is required');
  }

  const { user, tokens } = await authService.refresh(refreshToken, req.headers['user-agent']);

  res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.status(200).json({
    success: true,
    data: null,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
