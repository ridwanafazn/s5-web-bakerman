const mongoose = require('mongoose');

const manualActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    startDate: { type: Date, required: true, index: true },
    type: {
      type: String,
      enum: ['Run', 'Ride', 'Walk', 'Hike', 'Workout', 'Other'],
      required: true,
    },
    minutes: { type: Number, required: true, min: 1, max: 600 },
    note: { type: String, default: '', maxlength: 300 },
    screenshot: {
      publicId: String,
      secureUrl: String,
      deleteAfter: Date,
      uploadedAt: Date,
      mock: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

manualActivitySchema.index({ userId: 1, startDate: -1 });
manualActivitySchema.index({ userId: 1, date: 1 });
manualActivitySchema.index({ 'screenshot.deleteAfter': 1 });

module.exports = mongoose.model('ManualActivity', manualActivitySchema);
