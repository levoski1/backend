import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.accessSecret = env.JWT_ACCESS_SECRET;
    this.refreshSecret = env.JWT_REFRESH_SECRET;
    this.accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN;
    this.refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN;
  }

  generateAccessToken(userId: string, role: string): string {
    return jwt.sign({ sub: userId, role } satisfies AccessTokenPayload, this.accessSecret, {
      expiresIn: this.accessExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  generateRefreshToken(userId: string): { token: string; jti: string; expiresAt: Date } {
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.parseDuration(this.refreshExpiresIn));
    const token = jwt.sign({ sub: userId, jti } satisfies RefreshTokenPayload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
    return { token, jti, expiresAt };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, this.accessSecret) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, this.refreshSecret) as RefreshTokenPayload;
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) { return 7 * 24 * 60 * 60 * 1000; }
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
