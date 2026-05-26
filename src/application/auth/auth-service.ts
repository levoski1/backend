import bcrypt from 'bcrypt';
import { User, Email, PasswordHash, AuthProvider } from '@domain/index';
import { UserRepository } from '@infrastructure/database/repositories/user-repository';
import { env } from '@config/env';
import { ConflictError, AuthenticationError } from '@shared/errors';

export interface RegisterParams {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
}

export class AuthService {
  constructor(private readonly userRepo: UserRepository = new UserRepository()) {}

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

    return { user };
  }
}
