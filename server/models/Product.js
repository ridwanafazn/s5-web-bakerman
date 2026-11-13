const mongoose = require('mongoose');
const { sugarLevelFor } = require('../utils/sugar');

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 1000 },
    sugar: { type: Number, required: true, min: 0 }, // grams per serving
    sugarLevel: {
      type: String,
      enum: ['light', 'balanced', 'indulgent', 'extra'],
      default: 'balanced',
      index: true,
    },
    category: { type: String, default: 'Bakery', index: true },
    tags: [{ type: String, trim: true }],
    allergens: [{ type: String, trim: true }],
    ingredients: [{ type: String, trim: true }],
    image: { type: String, default: '' },
    active: { type: Boolean, default: true, index: true },

    // Legacy: stok global. Sumber kebenaran baru adalah DailyStock.
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre('validate', function setSugarLevel() {
  this.sugarLevel = sugarLevelFor(this.sugar);
});

module.exports = mongoose.model('Product', productSchema);
