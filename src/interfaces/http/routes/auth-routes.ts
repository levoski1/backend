import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rate-limiter.js';
import { registerSchema, loginSchema, refreshSchema, verifyEmailSchema, resendVerificationSchema } from '../validators/auth-validators.js';
import { register, login, refresh, logout, verifyEmail, resendVerification, verifyEmailFromLink } from '../controllers/auth-controller.js';
import '../middleware/passport.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user account
 *     description: Creates a new user account with local (email/password) authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       $ref: '#/components/schemas/AuthTokens/properties/accessToken'
 *                     refreshToken:
 *                       $ref: '#/components/schemas/AuthTokens/properties/refreshToken'
 *                   required: [user, accessToken, refreshToken]
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', authRateLimiter, validate(registerSchema), register);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify email address with token
 *     description: Verifies a user's email address using the token sent in the verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailInput'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       410:
 *         description: Token expired or already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.get('/verify-email', verifyEmailFromLink);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend verification email
 *     description: Resends the email verification link to the user's email address. Invalidates previous tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerificationInput'
 *     responses:
 *       200:
 *         description: Verification email sent (if account exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/resend-verification', authRateLimiter, validate(resendVerificationSchema), resendVerification);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Authenticate with email & password
 *     description: Logs in using Passport local strategy and returns JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       $ref: '#/components/schemas/AuthTokens/properties/accessToken'
 *                     refreshToken:
 *                       $ref: '#/components/schemas/AuthTokens/properties/refreshToken'
 *                   required: [user, accessToken, refreshToken]
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authRateLimiter, validate(loginSchema), login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new set of JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshInput'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       $ref: '#/components/schemas/AuthTokens/properties/accessToken'
 *                     refreshToken:
 *                       $ref: '#/components/schemas/AuthTokens/properties/refreshToken'
 *                   required: [user, accessToken, refreshToken]
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', authRateLimiter, validate(refreshSchema), refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout and invalidate refresh token
 *     description: Invalidates the provided refresh token so it cannot be used again
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutInput'
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 */
router.post('/logout', authRateLimiter, logout);

export default router;
