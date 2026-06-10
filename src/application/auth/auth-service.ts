import bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'node:crypto';
import { User, Email, PasswordHash, AuthProvider } from '../../domain/index.js';
import { UserRepository } from '../../infrastructure/database/repositories/user-repository.js';
import { RefreshTokenRepository } from '../../infrastructure/database/repositories/refresh-token-repository.js';
import { EmailVerificationTokenRepository } from '../../infrastructure/database/repositories/email-verification-token-repository.js';
import { PasswordResetTokenRepository } from '../../infrastructure/database/repositories/password-reset-token-repository.js';
import { EmailService } from '../../infrastructure/messaging/email-service.js';
import { JwtService } from './jwt-service.js';
import { env } from '../../config/env.js';
import { ConflictError, AuthenticationError, NotFoundError, TokenExpiredError } from '../../shared/errors/index.js';

interface OAuthProfile {
  id: string;
  displayName?: string;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

const OAUTH_PLACEHOLDER_PASSWORD = '$2b$12$placeholder.oauth.user.no.password.set';

function extractName(profile: OAuthProfile): string {
  if (profile.displayName?.trim()) {
    return profile.displayName.trim();
  }
  if (profile.name?.givenName || profile.name?.familyName) {
    return [profile.name.givenName, profile.name.familyName].filter(Boolean).join(' ').trim();
  }
  const emailName = profile.emails?.[0]?.value?.split('@')[0] ?? 'User';
  return emailName;
}

export interface RegisterParams {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResult {
  user: User;
}

export class AuthService {
  private readonly jwtService: JwtService;
  private readonly emailService: EmailService;

  constructor(
    private readonly userRepo: UserRepository = new UserRepository(),
    private readonly refreshTokenRepo: RefreshTokenRepository = new RefreshTokenRepository(),
    private readonly verificationTokenRepo: EmailVerificationTokenRepository = new EmailVerificationTokenRepository(),
    private readonly passwordResetTokenRepo: PasswordResetTokenRepository = new PasswordResetTokenRepository(),
  ) {
    this.jwtService = new JwtService();
    this.emailService = new EmailService();
  }

  async register(params: RegisterParams): Promise<RegisterResult> {
    const existing = await this.userRepo.findByEmail(params.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(params.password, env.BCRYPT_SALT_ROUNDS);

    const user = User.create({
      id: randomUUID(),
      fullName: params.fullName,
      email: Email.create(params.email),
      passwordHash: PasswordHash.create(hashedPassword),
      authProvider: AuthProvider.EMAIL,
      emailVerified: false,
      phoneNumber: params.phoneNumber,
    });

    const created = await this.userRepo.create(user);

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 60 * 1000);
    await this.verificationTokenRepo.create({
      id: randomUUID(),
      userId: created.id,
      token: otp,
      expiresAt,
    });

    await this.emailService.sendVerificationEmail(created.email.getValue(), otp);

    return { user: created };
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

  async verifyEmail(token: string): Promise<{ user: User }> {
    const storedToken = await this.verificationTokenRepo.findByToken(token);
    if (!storedToken) {
      throw new NotFoundError('Verification token');
    }

    if (storedToken.used_at) {
      throw new TokenExpiredError('Verification token has already been used');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new TokenExpiredError('Verification token has expired');
    }

    const user = await this.userRepo.findById(storedToken.user_id);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.emailVerified) {
      return { user };
    }

    const verified = user.markEmailVerified();
    const updated = await this.userRepo.update(verified);
    await this.verificationTokenRepo.markAsUsed(storedToken.id);

    return { user: updated };
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return;
    }

    if (user.emailVerified) {
      return;
    }

    await this.verificationTokenRepo.invalidateForUser(user.id);

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 60 * 1000);
    await this.verificationTokenRepo.create({
      id: randomUUID(),
      userId: user.id,
      token: otp,
      expiresAt,
    });

    await this.emailService.sendVerificationEmail(user.email.getValue(), otp);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return;
    }

    if (user.authProvider !== AuthProvider.EMAIL) {
      return;
    }

    await this.passwordResetTokenRepo.invalidateForUser(user.id);

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 60 * 1000);
    await this.passwordResetTokenRepo.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash: otp,
      expiresAt,
    });

    await this.emailService.sendResetPasswordEmail(user.email.getValue(), otp);
  }

  async verifyResetOtp(email: string, otp: string): Promise<{ resetToken: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.authProvider !== AuthProvider.EMAIL) {
      throw new AuthenticationError('Password reset not available for this account');
    }

    const storedToken = await this.passwordResetTokenRepo.findByOtp(otp);
    if (!storedToken || storedToken.user_id !== user.id) {
      throw new NotFoundError('Reset OTP');
    }

    if (storedToken.used_at) {
      throw new TokenExpiredError('Reset OTP has already been used');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new TokenExpiredError('Reset OTP has expired');
    }

    await this.passwordResetTokenRepo.markAsUsed(storedToken.id);

    const resetToken = this.jwtService.generatePasswordResetToken(user.id);

    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    let payload;
    try {
      payload = this.jwtService.verifyPasswordResetToken(resetToken);
    } catch {
      throw new AuthenticationError('Invalid or expired password reset token');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      throw new NotFoundError('User');
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
    const updated = user.withPasswordHash(PasswordHash.create(hashedPassword));
    await this.userRepo.update(updated);

    await this.refreshTokenRepo.revokeAllForUser(user.id);
  }

  async generateTokenPair(user: User): Promise<AuthTokens> {
    return this.generateTokens(user);
  }

  async handleOAuthUser(
    provider: AuthProvider,
    profile: OAuthProfile,
  ): Promise<AuthResult> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new AuthenticationError('OAuth provider did not return an email address');
    }

    let user = await this.userRepo.findByProviderId(profile.id);

    if (user) {
      await this.userRepo.updateLastLogin(user.id);
      const tokens = await this.generateTokens(user);
      return { user, tokens };
    }

    const existingByEmail = await this.userRepo.findByEmail(email);

    if (existingByEmail) {
      const linked = new User({
        ...existingByEmail.toParams(),
        providerId: profile.id,
        authProvider: provider,
        emailVerified: true,
        updatedAt: new Date(),
      });
      user = await this.userRepo.update(linked);
      const tokens = await this.generateTokens(user);
      return { user, tokens };
    }

    const fullName = extractName(profile);

    const newUser = User.create({
      id: randomUUID(),
      fullName,
      email: Email.create(email),
      passwordHash: PasswordHash.create(OAUTH_PLACEHOLDER_PASSWORD),
      authProvider: provider,
      emailVerified: true,
      providerId: profile.id,
    });

    user = await this.userRepo.create(newUser);
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.jwtService.hashToken(refreshToken);
    await this.refreshTokenRepo.revoke(tokenHash);
  }

  private generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  private async generateTokens(user: User, familyId?: string, deviceFingerprint?: string): Promise<AuthTokens> {
    const accessToken = this.jwtService.generateAccessToken(user.id, user.role);

    const { token: refreshToken, expiresAt } = this.jwtService.generateRefreshToken(user.id);

    await this.refreshTokenRepo.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash: this.jwtService.hashToken(refreshToken),
      familyId: familyId ?? randomUUID(),
      expiresAt,
      deviceFingerprint,
    });

    return { accessToken, refreshToken };
  }
}
