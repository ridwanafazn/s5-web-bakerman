const BUDGET_PRESETS = {
  santai: 120,
  seimbang: 90,
  ketat: 60,
};

const BONUS_TIERS = [
  { minMinutes: 150, bonusGrams: 45 },
  { minMinutes: 90, bonusGrams: 30 },
  { minMinutes: 60, bonusGrams: 20 },
  { minMinutes: 30, bonusGrams: 10 },
];

function sugarLevelFor(grams) {
  const sugar = Number(grams) || 0;
  if (sugar <= 10) return 'light';
  if (sugar <= 20) return 'balanced';
  if (sugar <= 35) return 'indulgent';
  return 'extra';
}

function bonusForMinutes(minutes) {
  const total = Number(minutes) || 0;
  const tier = BONUS_TIERS.find((item) => total >= item.minMinutes);
  return tier ? tier.bonusGrams : 0;
}

function budgetForPreset(preset) {
  return BUDGET_PRESETS[preset] || BUDGET_PRESETS.seimbang;
}

module.exports = {
  BUDGET_PRESETS,
  BONUS_TIERS,
  sugarLevelFor,
  bonusForMinutes,
  budgetForPreset,
};
