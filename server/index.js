const mongoose = require('mongoose');
const dns = require('dns');

const env = require('./config/env');
const createApp = require('./app');
const { initFirebase } = require('./config/firebase');
const { cleanupExpiredScreenshots } = require('./services/manualActivityService');

// Beberapa jaringan lokal menolak query SRV MongoDB Atlas.
// DNS_SERVERS=8.8.8.8,1.1.1.1 membuat resolusi SRV lebih stabil.
if (env.dnsServers.length > 0) {
  dns.setServers(env.dnsServers);
}

const app = createApp();

try {
  initFirebase();
} catch (error) {
  console.error('Firebase init error:', error.message);
}

mongoose
  .connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    console.error('Pastikan MONGODB_URI di server/.env benar dan database sedang berjalan.');
  });

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

const server = app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port} (${env.nodeEnv})`);
  console.log(`API docs: http://localhost:${env.port}/api-docs`);
});

// Bersihkan screenshot aktivitas manual yang sudah lewat 7 hari.
// Di Vercel, gunakan cron /api/v1/internal/cleanup-cloudinary.
if (
  !process.env.VERCEL &&
  (env.cloudinary.cloudName || env.cloudinary.mock) &&
  process.env.DISABLE_CLOUDINARY_CLEANUP_JOB !== 'true'
) {
  const runCleanup = () => {
    cleanupExpiredScreenshots()
      .then((result) => {
        if (result.scanned > 0) {
          console.log('[CLOUDINARY CLEANUP]', JSON.stringify(result));
        }
      })
      .catch((error) => {
        console.error('[CLOUDINARY CLEANUP]', error.message);
      });
  };

  setTimeout(runCleanup, 10_000).unref();
  setInterval(runCleanup, 24 * 60 * 60 * 1000).unref();
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    try {
      await mongoose.disconnect();
    } finally {
      process.exit(0);
    }
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
