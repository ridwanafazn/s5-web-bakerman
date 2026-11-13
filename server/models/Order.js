const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, max: 10 },
    sugarGrams: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], validate: (items) => items.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    totalSugarGrams: { type: Number, required: true, min: 0 },
    budgetWeekStart: { type: Date, required: true },
    pickup: {
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true,
      },
      date: { type: String, required: true },
      slotStart: { type: String, required: true },
      slotEnd: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'paid',
        'preparing',
        'ready',
        'picked_up',
        'canceled',
        'expired',
      ],
      default: 'pending_payment',
      index: true,
    },
    payment: {
      method: {
        type: String,
        enum: ['pay_at_pickup', 'qris_manual'],
        default: 'pay_at_pickup',
      },
      paidAt: Date,
      confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    idempotencyKey: { type: String, required: true },
    budgetOverride: { type: Boolean, default: false },
    notes: { type: String, default: '', maxlength: 500 },
    canceledAt: Date,
    expiredAt: Date,
    pickedUpAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ 'pickup.locationId': 1, 'pickup.date': 1, 'pickup.slotStart': 1 });

module.exports = mongoose.model('Order', orderSchema);
