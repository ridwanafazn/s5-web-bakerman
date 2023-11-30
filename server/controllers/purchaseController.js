// controllers/purchaseController.js
const User = require('../models/User');

exports.generateUniqueCode = async (req, res) => {
  try {
    // Generate a unique code (for example, a random string)
    const uniqueCode = Math.random().toString(36).substring(7);

    // Get the user's ID from the request or authentication
    const userId = req.user.id; // This assumes you have user information in the request object

    // Update the user's document in the database with the generated unique code
    await User.findByIdAndUpdate(userId, { uniqueCode });

    // Return the unique code in the response
    return res.status(200).json({ uniqueCode });
  } catch (error) {
    console.error('Error generating unique code:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.redeemPurchase = async (req, res) => {
  try {
    // Get the unique code from the request
    const { uniqueCode } = req.body;

    // Get the user's ID from the request or authentication
    const userId = req.user.id; // This assumes you have user information in the request object

    // Find the user in the database based on the user ID
    const user = await User.findById(userId);

    // Check if the user has chances and the unique code matches
    if (user.chances > 0 && user.uniqueCode === uniqueCode) {
      // Update user's chances and reset the unique code
      await User.findByIdAndUpdate(userId, { $inc: { chances: -1 }, uniqueCode: null });

      // Handle other logic related to successful redemption

      // Return success response
      return res.status(200).json({ success: true });
    } else {
      // Return failure response if the conditions are not met
      return res.status(400).json({ error: 'Invalid unique code or insufficient chances' });
    }
  } catch (error) {
    console.error('Error redeeming purchase:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
