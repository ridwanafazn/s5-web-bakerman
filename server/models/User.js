const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, default: '' },
    role: {
      type: String,
      enum: ['member', 'staff', 'admin'],
      default: 'member',
      index: true,
    },

    // Bakerman Balance
    budgetPreset: {
      type: String,
      enum: ['santai', 'seimbang', 'ketat'],
      default: 'seimbang',
    },
    weeklyBudgetGrams: { type: Number, default: 90, min: 0 },
    budgetMode: {
      type: String,
      enum: ['guide', 'strict'],
      default: 'guide',
    },
    strava: {
      athleteId: Number,
      athleteName: String,
      accessToken: String, // encrypted at rest
      refreshToken: String, // encrypted at rest
      expiresAt: Date,
      scope: String,
      connectedAt: Date,
      lastSyncAt: Date,
    },

    // Legacy fields — dipertahankan sementara agar UI lama tetap berjalan.
    // Akan dihapus setelah UI pindah ke /api/v1 (Fase 4).
    chances: { type: Number, default: 3 },
    chancesResetAt: { type: Date, default: Date.now },
    stravaLink: { type: String, default: '' },
    buyHistory: [
      {
        productList: { type: String, default: '' },
        price: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
