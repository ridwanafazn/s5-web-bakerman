const BudgetPeriod = require('../models/BudgetPeriod');
const {
  startOfWeekJakarta,
  endOfWeekJakarta,
} = require('../utils/time');
const { budgetForPreset } = require('../utils/sugar');

async function getOrCreateBudgetPeriod(user, now = new Date()) {
  const weekStart = startOfWeekJakarta(now);
  const weekEnd = endOfWeekJakarta(weekStart);

  const existing = await BudgetPeriod.findOne({ userId: user._id, weekStart });
  if (existing) return existing;

  try {
    return await BudgetPeriod.create({
      userId: user._id,
      weekStart,
      weekEnd,
      baseBudgetGrams: user.weeklyBudgetGrams,
      bonusGrams: 0,
      consumedGrams: 0,
      orderCount: 0,
      status: 'open',
    });
  } catch (error) {
    // Dua request pertama di minggu yang sama bisa balapan.
    if (error.code === 11000) {
      return BudgetPeriod.findOne({ userId: user._id, weekStart });
    }
    throw error;
  }
}

function budgetSummary(user, period) {
  const base = Number(period.baseBudgetGrams) || 0;
  const bonus = Number(period.bonusGrams) || 0;
  const consumed = Number(period.consumedGrams) || 0;
  const total = base + bonus;

  return {
    weekStart: period.weekStart,
    weekEnd: period.weekEnd,
    baseBudgetGrams: base,
    bonusGrams: bonus,
    consumedGrams: consumed,
    remainingGrams: total - consumed,
    totalGrams: total,
    mode: user.budgetMode,
    orderCount: period.orderCount,
    percentUsed: total > 0 ? Math.round((consumed / total) * 100) : 0,
  };
}

async function applyPresetToCurrentPeriod(user, period, preset) {
  const grams = budgetForPreset(preset);
  period.baseBudgetGrams = grams;
  await period.save();
  return period;
}

module.exports = {
  getOrCreateBudgetPeriod,
  budgetSummary,
  applyPresetToCurrentPeriod,
};
