const mongoose = require('mongoose');

const stravaActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activityId: { type: Number, required: true },
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    movingTimeSec: { type: Number, default: 0, min: 0 },
    distanceMeters: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    manual: { type: Boolean, default: false },
  },
  { timestamps: true }
);

stravaActivitySchema.index({ userId: 1, activityId: 1 }, { unique: true });
stravaActivitySchema.index({ userId: 1, startDate: -1 });

module.exports = mongoose.model('StravaActivity', stravaActivitySchema);
