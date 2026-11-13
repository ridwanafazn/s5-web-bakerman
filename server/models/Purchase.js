const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    productList: { type: String, default: 'Bakerman order' },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'redeemed'], default: 'active' },
    redeemedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
