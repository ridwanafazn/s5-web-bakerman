// utils/schedule.js
const cron = require('node-cron');
const User = require('../models/User');

// Schedule to reset chances every Monday at 00:00
cron.schedule('0 0 * * 1', async () => {
  try {
    await User.updateMany({}, { $set: { chances: 3 } });
    console.log('Chances reset successfully.');
  } catch (error) {
    console.error('Error resetting chances:', error.message);
  }
});
