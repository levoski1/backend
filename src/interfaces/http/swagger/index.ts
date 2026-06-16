import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../../../config/env.js';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Shelter API',
    version: '0.1.0',
    description: 'A Digital Sanctuary for Faith and Mental Health — REST API documentation',
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'Development server',
    },
    ...(env.RENDER_EXTERNAL_URL
      ? [{ url: `${env.RENDER_EXTERNAL_URL}${env.API_PREFIX}`, description: 'Production server' }]
      : []),
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'object' },
            },
          },
          meta: {
            type: 'object',
            properties: {
              requestId: { type: 'string', format: 'uuid' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT access token (short-lived)' },
          refreshToken: { type: 'string', description: 'JWT refresh token (long-lived)' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          authProvider: { type: 'string', enum: ['local', 'google', 'apple'] },
          accountStatus: { type: 'string', enum: ['active', 'suspended', 'deactivated'] },
          emailVerified: { type: 'boolean' },
          phoneNumber: { type: 'string', nullable: true, example: '+1234567890' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 50, example: 'Jane Doe' },
          email: { type: 'string', format: 'email', maxLength: 255, example: 'shelterfaithapps@gmail.com' },
          password: { type: 'string', minLength: 8, maxLength: 128, example: 'securePass123' },
          phoneNumber: { type: 'string', nullable: true, example: '+1234567890', description: 'Optional phone number' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shelterfaithapps@gmail.com' },
          password: { type: 'string', example: 'securePass123' },
        },
      },
      RefreshInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: 'JWT refresh token' },
        },
      },
      LogoutInput: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string', description: 'JWT refresh token to invalidate' },
        },
      },
      VerifyEmailInput: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: '6-digit verification code sent to email', pattern: '^\\d{6}$' },
        },
      },
      ResendVerificationInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shelterfaithapps@gmail.com', description: 'Email address to resend verification to' },
        },
      },
      ForgotPasswordInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shelterfaithapps@gmail.com', description: 'Email address to receive password reset OTP' },
        },
      },
      VerifyResetOtpInput: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shelterfaithapps@gmail.com', description: 'Email address' },
          otp: { type: 'string', description: '6-digit OTP from email', pattern: '^\\d{6}$' },
        },
      },
      VerifyResetOtpResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              resetToken: { type: 'string', description: 'Temporary JWT token for password reset (expires in 5 minutes)' },
            },
          },
          meta: {
            type: 'object',
            properties: {
              requestId: { type: 'string', format: 'uuid' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      ResetPasswordInput: {
        type: 'object',
        required: ['resetToken', 'password'],
        properties: {
          resetToken: { type: 'string', description: 'Temporary reset token from verify-reset-otp endpoint' },
          password: { type: 'string', minLength: 8, maxLength: 128, example: 'newSecurePass123', description: 'New password (min 8 characters)' },
        },
      },
    },
  },
};

const isDev = env.NODE_ENV === 'development';
const apis = isDev
  ? ['./src/interfaces/http/routes/*.ts']
  : ['./dist/interfaces/http/routes/*.js'];

const options = {
  swaggerDefinition,
  apis,
};

export const swaggerSpec = swaggerJsdoc(options);
