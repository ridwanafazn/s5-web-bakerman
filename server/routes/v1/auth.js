const express = require('express');
const router = express.Router();

const { requireAuth, loadUser } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimit');
const {
  getOrCreateBudgetPeriod,
  budgetSummary,
} = require('../../services/budgetService');
const { publicUser } = require('../../services/userService');

// POST /api/v1/auth/session
router.post('/session', authLimiter, requireAuth, loadUser, async (req, res, next) => {
  try {
    const period = await getOrCreateBudgetPeriod(req.user);
    res.json({
      user: publicUser(req.user),
      budget: budgetSummary(req.user, period),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
