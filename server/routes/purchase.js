// routes/purchase.js
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.post('/generate-code', purchaseController.generateUniqueCode);
router.post('/redeem-purchase', purchaseController.redeemPurchase);

module.exports = router;
