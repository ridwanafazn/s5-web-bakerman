const express = require('express');

const env = require('../../config/env');
const { cleanupExpiredScreenshots } = require('../../services/manualActivityService');

const router = express.Router();

function authorized(req) {
  if (!env.cronSecret) return false;

  const header = String(req.headers.authorization || '');
  const secret = String(req.headers['x-cron-secret'] || '');

  return header === `Bearer ${env.cronSecret}` || secret === env.cronSecret;
}

// GET /api/v1/internal/cleanup-cloudinary
// Dipanggil Vercel Cron dengan Authorization: Bearer <CRON_SECRET>.
router.get('/cleanup-cloudinary', async (req, res, next) => {
  if (!authorized(req)) {
    res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    return;
  }

  try {
    res.json(await cleanupExpiredScreenshots());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
