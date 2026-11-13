const mongoose = require('mongoose');

const budgetPeriodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    baseBudgetGrams: { type: Number, required: true, min: 0 },
    bonusGrams: { type: Number, default: 0, min: 0, max: 45 },
    consumedGrams: { type: Number, default: 0, min: 0 },
    orderCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

budgetPeriodSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('BudgetPeriod', budgetPeriodSchema);
