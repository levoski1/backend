import bcrypt from 'bcrypt';
import { User, Email, PasswordHash, AuthProvider } from '../../domain/index.js';
import { UserRepository } from '../../infrastructure/database/repositories/user-repository.js';
import { RefreshTokenRepository } from '../../infrastructure/database/repositories/refresh-token-repository.js';
import { JwtService } from './jwt-service.js';
import { env } from '../../config/env.js';
import { ConflictError, AuthenticationError } from '../../shared/errors/index.js';

export interface RegisterParams {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export class AuthService {
  private readonly jwtService: JwtService;

  constructor(
    private readonly userRepo: UserRepository = new UserRepository(),
    private readonly refreshTokenRepo: RefreshTokenRepository = new RefreshTokenRepository(),
  ) {
    this.jwtService = new JwtService();
  }

  async register(params: RegisterParams): Promise<AuthResult> {
    const existing = await this.userRepo.findByEmail(params.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(params.password, env.BCRYPT_SALT_ROUNDS);

    const user = User.create({
      id: crypto.randomUUID(),
      fullName: params.fullName,
      email: Email.create(params.email),
      passwordHash: PasswordHash.create(hashedPassword),
      authProvider: AuthProvider.EMAIL,
      emailVerified: true,
    });

    const created = await this.userRepo.create(user);
    const tokens = await this.generateTokens(created);

    return { user: created, tokens };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash.getValue());
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.canLogin()) {
      throw new AuthenticationError('Account is not active');
    }

    await this.userRepo.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  async refresh(refreshToken: string, deviceFingerprint?: string): Promise<AuthResult> {
    let payload;
    try {
      payload = this.jwtService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const tokenHash = this.jwtService.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!storedToken || storedToken.revoked_at) {
      if (storedToken?.family_id) {
        await this.refreshTokenRepo.revokeFamily(storedToken.family_id);
      }
      throw new AuthenticationError('Refresh token has been revoked');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      await this.refreshTokenRepo.revoke(tokenHash);
      throw new AuthenticationError('Refresh token has expired');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.canLogin()) {
      throw new AuthenticationError('User account not found or inactive');
    }

    await this.refreshTokenRepo.revoke(tokenHash);

    const newTokens = await this.generateTokens(user, storedToken.family_id, deviceFingerprint);

    return { user, tokens: newTokens };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.jwtService.hashToken(refreshToken);
    await this.refreshTokenRepo.revoke(tokenHash);
  }

  private async generateTokens(user: User, familyId?: string, deviceFingerprint?: string): Promise<AuthTokens> {
    const accessToken = this.jwtService.generateAccessToken(user.id, user.role);

    const { token: refreshToken, expiresAt } = this.jwtService.generateRefreshToken(user.id);

    await this.refreshTokenRepo.create({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: this.jwtService.hashToken(refreshToken),
      familyId: familyId ?? crypto.randomUUID(),
      expiresAt,
      deviceFingerprint,
    });

    return { accessToken, refreshToken };
  }
}
