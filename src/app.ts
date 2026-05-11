import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import responseTime from 'response-time';
import { env } from './config/env.js';
import { requestContext } from './interfaces/http/middleware/request-context.js';
import { ErrorHandler } from './interfaces/http/middleware/error-handler.js';
import { globalRateLimiter } from './interfaces/http/middleware/rate-limiter.js';
import { requestTimeout } from './interfaces/http/middleware/timeout.js';

const app = express();

// ─── Security ───────────────────────────────────────────
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  }),
);

// ─── Performance ────────────────────────────────────────
app.use(compression());
app.use(responseTime());

// ─── Rate Limiting ──────────────────────────────────────
app.use(globalRateLimiter);

// ─── Body Parsing ───────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Request Context & Timeout ──────────────────────────
app.use(requestContext);
app.use(requestTimeout);

// ─── Health Check ───────────────────────────────────────
app.get(`${env.API_PREFIX}/health`, (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    },
  });
});

// ─── Routes ─────────────────────────────────────────────
// Mount domain routes here as feature modules are built:
// app.use(`${env.API_PREFIX}/auth`, authRouter);
// app.use(`${env.API_PREFIX}/profiles`, profileRouter);
// app.use(`${env.API_PREFIX}/feed`, feedRouter);

// ─── Error Handling ─────────────────────────────────────
app.use(ErrorHandler.handle);

export default app;
