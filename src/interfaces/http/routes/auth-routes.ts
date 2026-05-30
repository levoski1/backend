import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rate-limiter.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth-validators.js';
import { register, login, refresh, logout } from '../controllers/auth-controller.js';
import '../middleware/passport.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', authRateLimiter, validate(refreshSchema), refresh);
router.post('/logout', authRateLimiter, logout);

export default router;
