const express = require('express');
const router = express.Router();

const {
  listProducts,
  getProductBySlug,
  listLocations,
  menuToday,
  listPickupSlots,
} = require('../../services/productService');

// GET /api/v1/products
router.get('/products', async (req, res, next) => {
  try {
    const products = await listProducts(req.query);
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:slug
router.get('/products/:slug', async (req, res, next) => {
  try {
    const product = await getProductBySlug(req.params.slug);
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/locations
router.get('/locations', async (req, res, next) => {
  try {
    const locations = await listLocations();
    res.json({ locations });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/menu/today
router.get('/menu/today', async (req, res, next) => {
  try {
    const menu = await menuToday(req.query.locationId);
    res.json(menu);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/pickup-slots?locationId=&date=YYYY-MM-DD
router.get('/pickup-slots', async (req, res, next) => {
  try {
    const slots = await listPickupSlots(req.query.locationId, req.query.date);
    res.json({ slots });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
