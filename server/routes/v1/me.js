const express = require('express');
const { z } = require('zod');
const router = express.Router();

const { requireAuth, loadUser } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const {
  getOrCreateBudgetPeriod,
  budgetSummary,
  applyPresetToCurrentPeriod,
} = require('../../services/budgetService');
const { publicUser, updateProfile } = require('../../services/userService');
const { getWeeklyRecap } = require('../../services/recapService');

const profileSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    budgetPreset: z.enum(['santai', 'seimbang', 'ketat']).optional(),
    budgetMode: z.enum(['guide', 'strict']).optional(),
  })
  .strict();

async function profilePayload(user) {
  const period = await getOrCreateBudgetPeriod(user);
  return {
    user: publicUser(user),
    budget: budgetSummary(user, period),
  };
}

// GET /api/v1/me
router.get('/', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await profilePayload(req.user));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/me/recap?weeks=4
router.get('/recap', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await getWeeklyRecap(req.user, { weeks: req.query.weeks }));
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/me
router.patch(
  '/',
  requireAuth,
  loadUser,
  validateBody(profileSchema),
  async (req, res, next) => {
    try {
      const presetChanged = req.body.budgetPreset !== undefined;
      const user = await updateProfile(req.user, req.body);

      if (presetChanged) {
        const period = await getOrCreateBudgetPeriod(user);
        await applyPresetToCurrentPeriod(user, period, user.budgetPreset);
      }

      res.json(await profilePayload(user));
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
