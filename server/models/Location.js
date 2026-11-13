const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    city: { type: String, default: 'Bandung', index: true },
    timezone: { type: String, default: 'Asia/Jakarta' },
    active: { type: Boolean, default: true, index: true },
    openingHours: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', locationSchema);
