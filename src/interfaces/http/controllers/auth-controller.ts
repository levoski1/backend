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
    phoneNumber: user.phoneNumber,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, phoneNumber } = req.body;

  const { user } = await authService.register({ fullName, email, password, phoneNumber });

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

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  const { user } = await authService.verifyEmail(token);

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
});

export const verifyEmailFromLink = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px 20px">
        <h1 style="font-size:24px;color:#18181b">Invalid verification link</h1>
        <p style="color:#52525b">This link is missing the verification token. Please use the full link from the email.</p>
      </body></html>
    `);
    return;
  }

  try {
    await authService.verifyEmail(token);
    res.status(200).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px 20px">
        <h1 style="font-size:24px;color:#18181b">Email verified ✓</h1>
        <p style="color:#52525b">Your email has been verified. You can now close this tab and sign in.</p>
      </body></html>
    `);
  } catch {
    res.status(400).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px 20px">
        <h1 style="font-size:24px;color:#18181b">Verification failed</h1>
        <p style="color:#52525b">This link is invalid or has expired. Please request a new verification email.</p>
      </body></html>
    `);
  }
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  await authService.resendVerification(email);

  res.status(200).json({
    success: true,
    data: null,
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
