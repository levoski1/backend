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

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    data: null,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  await authService.resetPassword(token, password);

  res.status(200).json({
    success: true,
    data: null,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const resetPasswordFromLink = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px 20px">
        <h1 style="font-size:24px;color:#18181b">Invalid reset link</h1>
        <p style="color:#52525b">This link is missing the reset token. Please use the full link from the email.</p>
      </body></html>
    `);
    return;
  }

  res.status(200).send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px 20px">
      <h1 style="font-size:24px;color:#18181b">Reset your password</h1>
      <form id="resetForm" style="margin-top:24px;display:flex;flex-direction:column;align-items:center;gap:16px">
        <input type="hidden" name="token" value="${token}">
        <input type="password" name="password" placeholder="New password (min 8 characters)" required minlength="8"
          style="width:280px;padding:12px 16px;font-size:14px;border:1px solid #d4d4d8;border-radius:8px;outline:none">
        <input type="password" name="confirmPassword" placeholder="Confirm new password" required minlength="8"
          style="width:280px;padding:12px 16px;font-size:14px;border:1px solid #d4d4d8;border-radius:8px;outline:none">
        <button type="submit"
          style="padding:12px 36px;font-size:15px;font-weight:600;color:#fff;background-color:#18181b;border:none;border-radius:8px;cursor:pointer">
          Reset password
        </button>
      </form>
      <p id="message" style="margin-top:16px;font-size:14px;color:#52525b"></p>
      <script>
        document.getElementById('resetForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const token = document.querySelector('input[name="token"]').value;
          const password = document.querySelector('input[name="password"]').value;
          const confirm = document.querySelector('input[name="confirmPassword"]').value;
          const msg = document.getElementById('message');

          if (password !== confirm) {
            msg.style.color = '#ef4444';
            msg.textContent = 'Passwords do not match';
            return;
          }

          try {
            const res = await fetch('/api/v1/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, password }),
            });
            if (res.ok) {
              msg.style.color = '#22c55e';
              msg.textContent = 'Password reset successfully! You can close this tab and sign in.';
              document.querySelector('button').disabled = true;
            } else {
              const data = await res.json();
              msg.style.color = '#ef4444';
              msg.textContent = data.error?.message || 'Reset failed. Please request a new link.';
            }
          } catch {
            msg.style.color = '#ef4444';
            msg.textContent = 'Network error. Please try again.';
          }
        });
      </script>
    </body></html>
  `);
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
