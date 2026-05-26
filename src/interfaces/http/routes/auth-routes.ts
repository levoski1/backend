import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rate-limiter';
import { registerSchema, loginSchema } from '../validators/auth-validators';
import { register, login } from '../controllers/auth-controller';
import '../middleware/passport';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);

export default router;
