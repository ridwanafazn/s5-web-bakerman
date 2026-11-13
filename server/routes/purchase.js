const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const { refreshWeeklyChances } = require('../utils/chances');

function createCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function uniqueCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createCode();
    const exists = await Purchase.exists({ code });
    if (!exists) return code;
  }
  throw new Error('Failed to generate a unique purchase code');
}

// POST /api/purchase/generate-code
// Body: { email?, productList?, price? }
// User dengan email akan kehilangan 1 chance saat kode dibuat.
router.post('/generate-code', async (req, res, next) => {
  try {
    const { email, productList = 'Bakerman order', price = 0 } = req.body || {};
    let user = null;

    if (email) {
      user = await User.findOne({ email: String(email).toLowerCase().trim() });
      if (!user) {
        return res.status(404).json({
          error: 'User not found. Sync your account first.',
          code: 'USER_NOT_FOUND',
        });
      }
      await refreshWeeklyChances(user);
      if (user.chances < 1) {
        return res.status(409).json({
          error: 'No purchase chances left this week.',
          code: 'NO_CHANCES_LEFT',
        });
      }
      user.chances -= 1;
      await user.save();
    }

    const purchase = await Purchase.create({
      code: await uniqueCode(),
      email: user ? user.email : undefined,
      productList,
      price,
    });

    res.status(201).json({
      uniqueCode: purchase.code,
      purchaseId: purchase._id,
      remainingChances: user ? user.chances : null,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/purchase/redeem-purchase
// Body: { purchaseCode, email? }
// Menandai kode sebagai redeemed dan mencatatnya ke buyHistory user.
router.post('/redeem-purchase', async (req, res, next) => {
  try {
    const { purchaseCode, email } = req.body || {};
    if (!purchaseCode) {
      return res.status(400).json({ error: 'purchaseCode is required' });
    }

    const purchase = await Purchase.findOne({
      code: String(purchaseCode).toUpperCase().trim(),
    });
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase code not found' });
    }
    if (purchase.status === 'redeemed') {
      return res.status(409).json({ error: 'Purchase code already redeemed' });
    }

    purchase.status = 'redeemed';
    purchase.redeemedAt = new Date();
    await purchase.save();

    const ownerEmail = purchase.email || (email ? String(email).toLowerCase().trim() : null);
    let user = null;

    if (ownerEmail) {
      user = await User.findOne({ email: ownerEmail });
      if (user) {
        user.buyHistory.push({
          productList: purchase.productList,
          price: purchase.price,
          date: new Date(),
        });
        await user.save();
      }
    }

    res.json({
      message: 'Purchase redeemed',
      purchase,
      buyHistory: user ? user.buyHistory : [],
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/purchase/code/:code - Cek status kode (tanpa menukarkannya)
router.get('/code/:code', async (req, res, next) => {
  try {
    const purchase = await Purchase.findOne({
      code: String(req.params.code).toUpperCase().trim(),
    }).select('-__v');
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase code not found' });
    }
    res.json(purchase);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
