const express = require('express');
const { z } = require('zod');
const router = express.Router();

const { requireAuth, loadUser, requireRole } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const orderService = require('../../services/orderService');
const { cleanupExpiredScreenshots } = require('../../services/manualActivityService');

const statusSchema = z
  .object({
    status: z.enum([
      'paid',
      'preparing',
      'ready',
      'picked_up',
      'canceled',
      'expired',
    ]),
  })
  .strict();

const stockSchema = z
  .object({
    locationId: z.string().trim().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    total: z.number().int().min(0),
  })
  .strict();

// GET /api/v1/admin/ping
router.get(
  '/ping',
  requireAuth,
  loadUser,
  requireRole('staff', 'admin'),
  (req, res) => {
    res.json({
      ok: true,
      role: req.user.role,
      email: req.user.email,
    });
  }
);

// GET /api/v1/admin/orders?status=&date=&locationId=
router.get(
  '/orders',
  requireAuth,
  loadUser,
  requireRole('staff', 'admin'),
  async (req, res, next) => {
    try {
      const orders = await orderService.listAdminOrders(req.query);
      res.json({ orders });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/admin/orders/:id/status
router.patch(
  '/orders/:id/status',
  requireAuth,
  loadUser,
  requireRole('staff', 'admin'),
  validateBody(statusSchema),
  async (req, res, next) => {
    try {
      const order = await orderService.updateOrderStatus(
        req.user,
        req.params.id,
        req.body.status
      );
      res.json({ order });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/admin/activities/cleanup
router.post(
  '/activities/cleanup',
  requireAuth,
  loadUser,
  requireRole('staff', 'admin'),
  async (req, res, next) => {
    try {
      res.json(await cleanupExpiredScreenshots());
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/admin/stock?date=&locationId=
router.get(
  '/stock',
  requireAuth,
  loadUser,
  requireRole('staff', 'admin'),
  async (req, res, next) => {
    try {
      const stock = await orderService.listAdminStock(
        req.query.locationId,
        req.query.date
      );
      res.json(stock);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/admin/stock/:productId
router.patch(
  '/stock/:productId',
  requireAuth,
  loadUser,
  requireRole('staff', 'admin'),
  validateBody(stockSchema),
  async (req, res, next) => {
    try {
      const stock = await orderService.setStock(
        req.user,
        req.params.productId,
        req.body
      );
      res.json({ stock });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
