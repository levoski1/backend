import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy, type Profile as GoogleProfile } from 'passport-google-oauth20';
import AppleStrategy from 'passport-apple';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { VerifyFunction as LocalVerifyFunction } from 'passport-local';
import type { VerifyCallback } from 'passport-google-oauth20';
import { UserRepository } from '../../../infrastructure/database/repositories/user-repository.js';
import { env } from '../../../config/env.js';
import { User, Email, PasswordHash, AuthProvider } from '../../../domain/index.js';
import { OAUTH_PLACEHOLDER_PASSWORD, extractName } from '../../../shared/utils/oauth-utils.js';

const userRepo = new UserRepository();

const localVerify: LocalVerifyFunction = async (email, password, done) => {
  try {
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash.getValue());
    if (!isValid) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    if (!user.canLogin()) {
      return done(null, false, { message: 'Account is not active' });
    }

    await userRepo.updateLastLogin(user.id);

    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

passport.use(new LocalStrategy({ usernameField: 'email', session: false }, localVerify));

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  const googleVerify = async (
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(null, false, { message: 'Google account has no email address' });
      }

      const existingByProvider = await userRepo.findByProviderId(profile.id);
      if (existingByProvider) {
        await userRepo.updateLastLogin(existingByProvider.id);
        return done(null, existingByProvider);
      }

      const existingByEmail = await userRepo.findByEmail(email);
      if (existingByEmail) {
        const linked = new User({
          ...existingByEmail.toParams(),
          providerId: profile.id,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
          updatedAt: new Date(),
        });
        const updated = await userRepo.update(linked);
        await userRepo.updateLastLogin(updated.id);
        return done(null, updated);
      }

      const fullName = extractName({ displayName: profile.displayName, name: profile.name, email });

      const newUser = User.create({
        id: randomUUID(),
        fullName,
        email: Email.create(email),
        passwordHash: PasswordHash.create(OAUTH_PLACEHOLDER_PASSWORD),
        authProvider: AuthProvider.GOOGLE,
        emailVerified: true,
        providerId: profile.id,
      });

      const created = await userRepo.create(newUser);
      return done(null, created);
    } catch (err) {
      return done(err instanceof Error ? err : new Error(String(err)));
    }
  };

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      googleVerify,
    ),
  );
}

if (env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY) {
  const appleVerify = async (
    _accessToken: string,
    _refreshToken: string,
    idToken: Record<string, unknown>,
    profile: Record<string, unknown> | undefined,
    done: (error: Error | null, user?: Express.User | false, info?: { message?: string }) => void,
  ): Promise<void> => {
    try {
      const email = (profile?.email as string) ?? (idToken?.email as string);
      if (!email) {
        return done(null, false, { message: 'Apple account has no email address' });
      }

      const appleId = (profile?.sub as string) ?? (idToken?.sub as string);
      if (!appleId) {
        return done(null, false, { message: 'Apple account has no identifier' });
      }

      const existingByProvider = await userRepo.findByProviderId(appleId);
      if (existingByProvider) {
        await userRepo.updateLastLogin(existingByProvider.id);
        return done(null, existingByProvider);
      }

      const existingByEmail = await userRepo.findByEmail(email);
      if (existingByEmail) {
        const linked = new User({
          ...existingByEmail.toParams(),
          providerId: appleId,
          authProvider: AuthProvider.APPLE,
          emailVerified: true,
          updatedAt: new Date(),
        });
        const updated = await userRepo.update(linked);
        await userRepo.updateLastLogin(updated.id);
        return done(null, updated);
      }

      const fullName = extractName({
        displayName: profile?.name as string | undefined,
        email,
      });

      const newUser = User.create({
        id: randomUUID(),
        fullName,
        email: Email.create(email),
        passwordHash: PasswordHash.create(OAUTH_PLACEHOLDER_PASSWORD),
        authProvider: AuthProvider.APPLE,
        emailVerified: true,
        providerId: appleId,
      });

      const created = await userRepo.create(newUser);
      return done(null, created);
    } catch (err) {
      return done(err instanceof Error ? err : new Error(String(err)));
    }
  };

  passport.use(
    new AppleStrategy(
      {
        clientID: env.APPLE_CLIENT_ID,
        teamID: env.APPLE_TEAM_ID,
        keyID: env.APPLE_KEY_ID,
        privateKeyString: env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        callbackURL: env.APPLE_CALLBACK_URL,
        scope: ['name', 'email'],
        passReqToCallback: false,
      },
      appleVerify,
    ),
  );
}

export default passport;
