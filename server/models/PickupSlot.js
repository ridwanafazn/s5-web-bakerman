const mongoose = require('mongoose');

const pickupSlotSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
    capacity: { type: Number, default: 8, min: 0 },
    booked: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pickupSlotSchema.index({ locationId: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('PickupSlot', pickupSlotSchema);
