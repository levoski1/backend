import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { logger } from './shared/logging/logger.js';
import { requestContext, ErrorHandler } from './interfaces/http/middleware/index.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestContext);

app.get(`${env.API_PREFIX}/health`, (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
    },
  });
});

app.use(ErrorHandler.handle);

app.listen(env.PORT, env.HOST, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Shelter API started');
});

export default app;
