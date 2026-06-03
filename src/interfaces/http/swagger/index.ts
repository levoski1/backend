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
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 50, example: 'Jane Doe' },
          email: { type: 'string', format: 'email', maxLength: 255, example: 'jane@example.com' },
          password: { type: 'string', minLength: 8, maxLength: 128, example: 'securePass123' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
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
