const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { refreshWeeklyChances } = require('../utils/chances');

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

// POST /api/user/sync - Buat atau ambil user berdasarkan email (dipanggil setelah login)
router.post('/sync', async (req, res, next) => {
  try {
    const { email, name } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const update = { $setOnInsert: { chances: 3 } };
    if (name) update.$set = { name };

    const user = await User.findOneAndUpdate(
      { email: normalizeEmail(email) },
      update,
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    await refreshWeeklyChances(user);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// GET /api/user?email=:email - Mendapatkan data user (chances, dll)
router.get('/', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await refreshWeeklyChances(user);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// GET /api/user/buy-history?email=:email - Mendapatkan riwayat pembelian
router.get('/buy-history', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.buyHistory);
  } catch (error) {
    next(error);
  }
});

// POST /api/user/strava-link - Menyimpan link Strava user
router.post('/strava-link', async (req, res, next) => {
  try {
    const { email, link } = req.body || {};
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await User.findOne({ email: normalized });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.stravaLink = link || '';
    await user.save();
    res.json({ message: 'Strava link saved', user });
  } catch (error) {
    next(error);
  }
});

// GET /api/user/:email - Mendapatkan data user berdasarkan email
router.get('/:email', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: normalizeEmail(req.params.email) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
