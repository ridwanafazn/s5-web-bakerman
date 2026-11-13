const mongoose = require('mongoose');

const dailyStockSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD (Asia/Jakarta)
    total: { type: Number, required: true, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

dailyStockSchema.index({ locationId: 1, productId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyStock', dailyStockSchema);
