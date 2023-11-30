const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  chances: { type: Number, default: 3 },
  uniqueCode: String,
  lastPurchaseTime: Date,
});

const User = mongoose.model('User', userSchema);

module.exports = User;