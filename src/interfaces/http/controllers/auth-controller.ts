import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import type { User } from '@domain/index';
import { AuthService } from '@application/auth/auth-service';
import { asyncHandler } from '@shared/utils';

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

  const { user } = await authService.register({ fullName, email, password });

  res.status(201).json({
    success: true,
    data: {
      user: sanitizeUser(user),
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, (err: Error | null, passportUser: Express.User | false, info: { message?: string } | undefined) => {
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

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  })(req, res, next);
};
