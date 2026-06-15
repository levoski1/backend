import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../shared/logging/logger.js';
import { InternalError } from '../../shared/errors/index.js';
import { getVerificationEmailHtml } from './templates/verification-email.js';
import { getResetPasswordEmailHtml } from './templates/reset-password-email.js';

export class EmailService {
  private resend: Resend | null = null;

  private getClient(): Resend {
    if (!this.resend) {
      if (!env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
      }
      this.resend = new Resend(env.RESEND_API_KEY);
    }
    return this.resend;
  }

  async sendVerificationEmail(to: string, otp: string): Promise<void> {
    if (!env.RESEND_API_KEY) {
      logger.warn({ to, otp }, 'No RESEND_API_KEY configured — skipping verification email');
      return;
    }

    const { error } = await this.getClient().emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Verify your email address — Shelter',
      html: getVerificationEmailHtml(otp),
    });

    if (error) {
      logger.error({ error: { name: error.name, message: error.message }, from: env.EMAIL_FROM, to }, 'Failed to send verification email');
      throw new InternalError('Failed to send verification email');
    }

    logger.info({ to }, 'Verification email sent');
  }

  async sendResetPasswordEmail(to: string, otp: string): Promise<void> {
    if (!env.RESEND_API_KEY) {
      logger.warn({ to, otp }, 'No RESEND_API_KEY configured — skipping password reset email');
      return;
    }

    const { error } = await this.getClient().emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Reset your password — Shelter',
      html: getResetPasswordEmailHtml(otp),
    });

    if (error) {
      logger.error({ error: { name: error.name, message: error.message }, from: env.EMAIL_FROM, to }, 'Failed to send password reset email');
      throw new InternalError('Failed to send password reset email');
    }

    logger.info({ to }, 'Password reset email sent');
  }
}

export const emailService = new EmailService();
