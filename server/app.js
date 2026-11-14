const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerDocument = require('./docs/swagger');
const { writeLimiter } = require('./middleware/rateLimit');
const { requestLogger } = require('./middleware/requestLogger');
const { connectDb } = require('./config/db');

const authRoutes = require('./routes/v1/auth');
const meRoutes = require('./routes/v1/me');
const catalogRoutes = require('./routes/v1/catalog');
const adminRoutes = require('./routes/v1/admin');
const stravaRoutes = require('./routes/v1/strava');
const orderRoutes = require('./routes/v1/orders');
const activityRoutes = require('./routes/v1/activities');
const internalRoutes = require('./routes/v1/internal');

// Legacy routes — dipertahankan sementara agar UI lama tetap berjalan.
const legacyProductRoutes = require('./routes/products');
const legacyUserRoutes = require('./routes/user');
const legacyPurchaseRoutes = require('./routes/purchase');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);
  app.use(
    helmet({
      // Swagger UI membutuhkan inline script/style; hanya aktif di non-production.
      contentSecurityPolicy: env.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
    })
  );
  app.use(express.json({ limit: '100kb' }));

  if (env.logRequests) {
    app.use(requestLogger);
  }

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: env.nodeEnv,
    });
  });

  app.get('/ready', async (req, res) => {
    if (process.env.SKIP_DB_CONNECT === 'true') {
      return res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
      });
    }

    try {
      await connectDb();
      await mongoose.connection.db.admin().ping();
      return res.json({ status: 'ready', database: 'connected' });
    } catch {
      return res.status(503).json({
        status: 'not_ready',
        database: 'unreachable',
      });
    }
  });

  if (!env.isProduction) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  // Auth/me dipasang sebelum pengecekan database agar request tanpa token
  // tetap mendapat 401 yang benar.
  app.use('/api', async (req, res, next) => {
    if (process.env.SKIP_DB_CONNECT === 'true') return next();

    try {
      await connectDb();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/me', meRoutes);

  app.use('/api', writeLimiter);

  // Admin auth dicek sebelum readiness DB agar request tanpa token tetap 401.
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/strava', stravaRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/activities', activityRoutes);

  app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState === 1) return next();
    res.status(503).json({
      error: 'Database belum terhubung. Coba lagi beberapa detik lagi.',
      code: 'DATABASE_UNAVAILABLE',
    });
  });

  // Internal/cron setelah readiness DB.
  app.use('/api/v1/internal', internalRoutes);

  // Legacy API (UI lama)
  app.use('/api/products', legacyProductRoutes);
  app.use('/api/user', legacyUserRoutes);
  app.use('/api/purchase', legacyPurchaseRoutes);

  // API v1
  app.use('/api/v1', catalogRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Error handler terpusat.
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON body tidak valid' });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message, code: 'VALIDATION_ERROR' });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID tidak valid', code: 'INVALID_ID' });
    }

    if (err.code === 11000) {
      return res.status(409).json({ error: 'Data sudah ada (duplikat).', code: 'DUPLICATE' });
    }

    const status = err.status || 500;
    if (status >= 500) {
      console.error('[API ERROR]', err.message);
    }

    res.status(status).json({
      error:
        status >= 500 && env.isProduction
          ? 'Internal server error'
          : err.message || 'Internal server error',
      ...(err.code ? { code: err.code } : {}),
    });
  });

  return app;
}

module.exports = createApp;
