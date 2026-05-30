import { getDb } from '../connection.js';
import { InternalError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  device_fingerprint: string | null;
  family_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export class RefreshTokenRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    deviceFingerprint?: string;
  }): Promise<void> {
    const [inserted] = await this.db<RefreshTokenRow>('refresh_tokens')
      .insert({
        id: params.id,
        user_id: params.userId,
        token_hash: params.tokenHash,
        family_id: params.familyId,
        expires_at: params.expiresAt,
        device_fingerprint: params.deviceFingerprint ?? null,
      })
      .returning('id');

    if (!inserted) {
      throw new InternalError('Failed to store refresh token');
    }
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRow | null> {
    const row = await this.db<RefreshTokenRow>('refresh_tokens')
      .where({ token_hash: tokenHash })
      .first();

    return row ?? null;
  }

  async revoke(tokenHash: string): Promise<void> {
    await this.db<RefreshTokenRow>('refresh_tokens')
      .where({ token_hash: tokenHash })
      .update({ revoked_at: this.db.fn.now() });
  }

  async revokeFamily(familyId: string, exceptTokenHash?: string): Promise<void> {
    let query = this.db<RefreshTokenRow>('refresh_tokens')
      .where({ family_id: familyId })
      .whereNull('revoked_at');

    if (exceptTokenHash) {
      query = query.whereNot({ token_hash: exceptTokenHash });
    }

    await query.update({ revoked_at: this.db.fn.now() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db<RefreshTokenRow>('refresh_tokens')
      .where({ user_id: userId })
      .whereNull('revoked_at')
      .update({ revoked_at: this.db.fn.now() });
  }
}
