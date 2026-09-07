import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env, webOrigins } from './config.js';
import { prisma } from './db.js';
import { errorHandler, notFound } from './lib/errors.js';
import { uploadDirectory } from './lib/storage.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { businessRouter } from './routes/business.routes.js';
import { customerRouter } from './routes/customer.routes.js';
import { publicRouter } from './routes/public.routes.js';
import openapi from '../openapi.json' with { type: 'json' };

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(pinoHttp({ redact: ['req.headers.authorization', 'req.headers.cookie'] }));
  app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || webOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Origin nuk lejohet nga CORS.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
  );
  app.use(
    '/uploads',
    express.static(uploadDirectory, {
      fallthrough: false,
      maxAge: env.NODE_ENV === 'production' ? '7d' : 0,
    }),
  );

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ success: true, data: { status: 'ok', database: 'ok', timestamp: new Date().toISOString() } });
    } catch {
      res.status(503).json({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is unavailable.' } });
    }
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  app.use('/api/auth', authRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/business', businessRouter);
  app.use('/api/customer', customerRouter);
  app.use('/api/admin', adminRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
