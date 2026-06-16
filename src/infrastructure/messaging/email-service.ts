import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../shared/logging/logger.js';
import { InternalError } from '../../shared/errors/index.js';
import { getVerificationEmailHtml, getVerificationEmailPlainText } from './templates/verification-email.js';
import { getResetPasswordEmailHtml, getResetPasswordEmailPlainText } from './templates/reset-password-email.js';

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

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

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    if (!env.RESEND_API_KEY) {
      logger.warn({ to: params.to, subject: params.subject }, 'No RESEND_API_KEY configured — skipping email');
      return;
    }

    const replyTo = extractEmailAddress(env.EMAIL_FROM);

    const { error } = await this.getClient().emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo,
      headers: {
        'X-Entity-Ref-ID': `${Date.now()}-${params.to}`,
      },
    });

    if (error) {
      logger.error({ error: { name: error.name, message: error.message }, from: env.EMAIL_FROM, to: params.to }, 'Failed to send email');
      throw new InternalError('Failed to send email');
    }

    logger.info({ to: params.to, subject: params.subject }, 'Email sent');
  }

  async sendVerificationEmail(to: string, otp: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Verify your email address — Shelter',
      html: getVerificationEmailHtml(otp),
      text: getVerificationEmailPlainText(otp),
    });
  }

  async sendResetPasswordEmail(to: string, otp: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Reset your password — Shelter',
      html: getResetPasswordEmailHtml(otp),
      text: getResetPasswordEmailPlainText(otp),
    });
  }
}

export const emailService = new EmailService();
