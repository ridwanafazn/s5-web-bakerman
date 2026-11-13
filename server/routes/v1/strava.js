const express = require('express');
const router = express.Router();

const env = require('../../config/env');
const { requireAuth, loadUser } = require('../../middleware/auth');
const stravaService = require('../../services/stravaService');

function frontendUrl(path) {
  const origin =
    env.corsOrigins.find((item) => item !== '*') || 'http://localhost:5173';
  return `${origin.replace(/\/$/, '')}${path}`;
}

// GET /api/v1/strava/connect
router.get('/connect', requireAuth, loadUser, async (req, res, next) => {
  try {
    const url = await stravaService.getConnectUrl(req.user);
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/strava/callback
router.get('/callback', async (req, res) => {
  try {
    await stravaService.handleCallback(req.query.code, req.query.state);
    res.redirect(frontendUrl('/balance?strava=connected'));
  } catch (error) {
    const message = encodeURIComponent(error.message || 'Gagal menghubungkan Strava');
    res.redirect(frontendUrl(`/balance?strava=error&message=${message}`));
  }
});

// GET /api/v1/strava/status
router.get('/status', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await stravaService.status(req.user));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/strava/sync
router.post('/sync', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await stravaService.syncActivities(req.user));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/strava/demo
router.post('/demo', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await stravaService.addDemoActivity(req.user));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/strava/demo
router.delete('/demo', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await stravaService.resetDemo(req.user));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/strava/disconnect
router.delete('/disconnect', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await stravaService.disconnect(req.user));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
