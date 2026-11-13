const express = require('express');
const { z } = require('zod');
const router = express.Router();

const { requireAuth, loadUser } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const orderService = require('../../services/orderService');

const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().trim().min(1),
          qty: z.number().int().min(1).max(10),
        })
      )
      .min(1)
      .max(10),
    pickup: z.object({
      locationId: z.string().trim().optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      slotStart: z.string().regex(/^\d{2}:\d{2}$/),
    }),
    paymentMethod: z.enum(['pay_at_pickup', 'qris_manual']).optional(),
    notes: z.string().max(500).optional(),
    idempotencyKey: z.string().min(8).max(100),
    budgetOverride: z.boolean().optional(),
  })
  .strict();

// POST /api/v1/orders
router.post(
  '/',
  requireAuth,
  loadUser,
  validateBody(createOrderSchema),
  async (req, res, next) => {
    try {
      const result = await orderService.createOrder(req.user, req.body);
      res.status(result.created ? 201 : 200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/orders?status=&page=&limit=
router.get('/', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await orderService.listUserOrders(req.user, req.query));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/:code
router.get('/:code', requireAuth, loadUser, async (req, res, next) => {
  try {
    const order = await orderService.getOrderByCode(req.user, req.params.code);
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', requireAuth, loadUser, async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.user, req.params.id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
