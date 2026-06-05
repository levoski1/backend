import { getDb } from '../connection.js';
import { InternalError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

export interface EmailVerificationTokenRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export class EmailVerificationTokenRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async create(params: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    const [inserted] = await this.db<EmailVerificationTokenRow>('email_verification_tokens')
      .insert({
        id: params.id,
        user_id: params.userId,
        token: params.token,
        expires_at: params.expiresAt,
      })
      .returning('id');

    if (!inserted) {
      throw new InternalError('Failed to store verification token');
    }
  }

  async findByToken(token: string): Promise<EmailVerificationTokenRow | null> {
    const row = await this.db<EmailVerificationTokenRow>('email_verification_tokens')
      .where({ token })
      .first();

    return row ?? null;
  }

  async markAsUsed(id: string): Promise<void> {
    const [updated] = await this.db<EmailVerificationTokenRow>('email_verification_tokens')
      .where({ id })
      .update({ used_at: this.db.fn.now() })
      .returning('id');

    if (!updated) {
      throw new InternalError('Failed to mark verification token as used');
    }
  }

  async invalidateForUser(userId: string): Promise<void> {
    await this.db<EmailVerificationTokenRow>('email_verification_tokens')
      .where({ user_id: userId })
      .whereNull('used_at')
      .update({ used_at: this.db.fn.now() });
  }
}
