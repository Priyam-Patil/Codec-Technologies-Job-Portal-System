import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { databaseDiagnostic } from './utils/databaseDiagnostic.js';
import * as Sentry from '@sentry/node';
import { clerkMiddleware } from '@clerk/express';
import clerkWebhooks from './controllers/webhooks.js';
import companyRoutes from './routes/companyRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { rateLimit, securityHeaders, errorHandler } from './middleware/security.js';

export function createApp({ identityMiddleware = clerkMiddleware(), runtimeMode, connectDatabase } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (runtimeMode?.startsWith('local-')) app.use((req, res, next) => { res.set('X-InsiderJobs-Mode', runtimeMode); next(); });
  app.use(securityHeaders);
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  app.use(cors({ origin: origins.length ? origins : true, credentials: false }));
  // Connection failures must pass through CORS and the normal JSON error handler.
  if (connectDatabase) app.use(async (req, res, next) => {
    try { await connectDatabase(); next(); }
    catch (error) {
      const diagnostic = databaseDiagnostic(error);
      next(Object.assign(new Error('Database temporarily unavailable. Try again shortly.'), { status: 503, publicCode: diagnostic.code }));
    }
  });
  app.get('/', (req, res) => res.send('API Working'));
  app.get('/health', (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({ success: connected, service: 'insiderjobs-api', database: connected ? 'connected' : 'unavailable' });
  });
  app.get('/debug-sentry', (req, res) => {
    if (process.env.NODE_ENV !== 'development') return res.status(404).json({ success: false, message: 'Route not found' });
    throw new Error('Development telemetry test');
  });
  app.post('/webhooks', express.raw({ type: 'application/json', limit: '256kb' }), clerkWebhooks);
  app.use(express.json({ limit: '256kb' }));
  app.use((req, res, next) => { req.body ??= {}; next(); });
  app.use(identityMiddleware);
  app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Database temporarily unavailable. Try again shortly.', code: 'DATABASE_UNAVAILABLE' });
    next();
  });
  app.use('/api', rateLimit({ limit: 180 }));
  app.use('/api/company', companyRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/users', userRoutes);
  app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
  if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
  app.use(errorHandler);
  return app;
}
export default createApp;
