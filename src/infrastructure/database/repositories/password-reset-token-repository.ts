import { getDb } from '../connection.js';
import { InternalError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export class PasswordResetTokenRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    const [inserted] = await this.db<PasswordResetTokenRow>('password_reset_tokens')
      .insert({
        id: params.id,
        user_id: params.userId,
        token_hash: params.tokenHash,
        expires_at: params.expiresAt,
      })
      .returning('id');

    if (!inserted) {
      throw new InternalError('Failed to store password reset token');
    }
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetTokenRow | null> {
    const row = await this.db<PasswordResetTokenRow>('password_reset_tokens')
      .where({ token_hash: tokenHash })
      .first();

    return row ?? null;
  }

  async markAsUsed(id: string): Promise<void> {
    const [updated] = await this.db<PasswordResetTokenRow>('password_reset_tokens')
      .where({ id })
      .update({ used_at: this.db.fn.now() })
      .returning('id');

    if (!updated) {
      throw new InternalError('Failed to mark password reset token as used');
    }
  }

  async invalidateForUser(userId: string): Promise<void> {
    await this.db<PasswordResetTokenRow>('password_reset_tokens')
      .where({ user_id: userId })
      .whereNull('used_at')
      .update({ used_at: this.db.fn.now() });
  }
}
