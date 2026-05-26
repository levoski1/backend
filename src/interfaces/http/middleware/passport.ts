import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { UserRepository } from '@infrastructure/database/repositories/user-repository';

const userRepo = new UserRepository();

passport.use(
  new LocalStrategy(
    { usernameField: 'email', session: false },
    async (email, password, done) => {
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
    },
  ),
);

export default passport;
