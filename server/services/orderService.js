const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const DailyStock = require('../models/DailyStock');
const PickupSlot = require('../models/PickupSlot');
const BudgetPeriod = require('../models/BudgetPeriod');
const AuditLog = require('../models/AuditLog');
const { getOrCreateBudgetPeriod } = require('./budgetService');
const { resolveLocationId } = require('./productService');
const { httpError } = require('../utils/httpError');
const { generateOrderCode } = require('../utils/orderCode');
const {
  parsePagination,
  resolveOrderStatusFilter,
} = require('../utils/pagination');
const {
  isoDateJakarta,
  addDaysIso,
  startOfWeekJakarta,
} = require('../utils/time');

const TRANSITIONS = {
  pending_payment: ['paid', 'canceled', 'expired'],
  paid: ['preparing', 'canceled'],
  preparing: ['ready'],
  ready: ['picked_up', 'expired'],
  picked_up: [],
  canceled: [],
  expired: [],
};

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'Order minimal 1 item', 'ITEMS_REQUIRED');
  }

  if (items.length > 10) {
    throw httpError(400, 'Maksimal 10 item per order', 'TOO_MANY_ITEMS');
  }

  const merged = new Map();
  for (const item of items) {
    const slug = String(item.slug || '').trim();
    const qty = Number(item.qty);

    if (!slug || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      throw httpError(400, 'Item atau qty tidak valid', 'INVALID_ITEM');
    }

    merged.set(slug, (merged.get(slug) || 0) + qty);
  }

  const normalized = [...merged.entries()].map(([slug, qty]) => ({ slug, qty }));
  if (normalized.length > 10) {
    throw httpError(400, 'Maksimal 10 produk berbeda', 'TOO_MANY_ITEMS');
  }

  return normalized;
}

async function loadProducts(items) {
  const slugs = items.map((item) => item.slug);
  const products = await Product.find({ slug: { $in: slugs }, active: true });
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  return items.map((item) => {
    const product = bySlug.get(item.slug);
    if (!product) {
      throw httpError(400, `Produk tidak ditemukan: ${item.slug}`, 'PRODUCT_NOT_FOUND');
    }

    return {
      product,
      qty: item.qty,
      lineTotal: product.price * item.qty,
      sugarGrams: product.sugar * item.qty,
    };
  });
}

async function resolvePickup(pickup = {}) {
  const locationId = await resolveLocationId(pickup.locationId);
  const today = isoDateJakarta();
  const maxDate = addDaysIso(today, 6);
  const date = String(pickup.date || '');
  const slotStart = String(pickup.slotStart || '');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today || date > maxDate) {
    throw httpError(400, 'Tanggal pickup harus hari ini s/d 7 hari ke depan', 'INVALID_PICKUP_DATE');
  }

  if (!slotStart) {
    throw httpError(400, 'Slot pickup wajib dipilih', 'SLOT_REQUIRED');
  }

  const slot = await PickupSlot.findOne({
    locationId,
    date,
    startTime: slotStart,
    active: true,
  });

  if (!slot) {
    throw httpError(409, 'Slot pickup tidak tersedia', 'SLOT_NOT_FOUND');
  }

  return {
    locationId,
    date,
    slotStart,
    slotEnd: slot.endTime,
  };
}

async function uniqueCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateOrderCode();
    const exists = await Order.exists({ code });
    if (!exists) return code;
  }

  throw httpError(500, 'Gagal membuat kode order', 'CODE_GENERATION_FAILED');
}

function assertBudget(user, period, totalSugarGrams, budgetOverride) {
  const remaining =
    (period.baseBudgetGrams || 0) +
    (period.bonusGrams || 0) -
    (period.consumedGrams || 0);

  if (totalSugarGrams <= remaining) return false;

  if (user.budgetMode === 'strict') {
    throw httpError(
      409,
      `Order melebihi budget. Sisa ${remaining} g, dibutuhkan ${totalSugarGrams} g.`,
      'BUDGET_EXCEEDED'
    );
  }

  if (!budgetOverride) {
    throw httpError(
      409,
      `Order melebihi budget ${totalSugarGrams - remaining} g. Konfirmasi overage untuk lanjut.`,
      'BUDGET_CONFIRM_REQUIRED'
    );
  }

  return true;
}

function serializeOrder(order) {
  if (!order) return null;

  const location = order.pickup?.locationId;
  const populatedUser =
    order.userId && typeof order.userId === 'object' && order.userId.email
      ? { name: order.userId.name || '', email: order.userId.email }
      : undefined;

  return {
    id: order._id,
    code: order.code,
    status: order.status,
    items: (order.items || []).map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      qty: item.qty,
      sugarGrams: item.sugarGrams,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal,
    totalSugarGrams: order.totalSugarGrams,
    budgetWeekStart: order.budgetWeekStart,
    budgetOverride: order.budgetOverride,
    pickup: {
      locationId: location?._id || location,
      locationName: location?.name || '',
      address: location?.address || '',
      city: location?.city || '',
      date: order.pickup?.date,
      slotStart: order.pickup?.slotStart,
      slotEnd: order.pickup?.slotEnd,
    },
    payment: order.payment,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    canceledAt: order.canceledAt,
    expiredAt: order.expiredAt,
    pickedUpAt: order.pickedUpAt,
    user: populatedUser,
  };
}

async function getOrderLean(query) {
  const order = await Order.findOne(query)
    .populate('pickup.locationId', 'name address city')
    .populate('userId', 'name email')
    .lean();
  return order;
}

async function audit(session, actorId, action, entityId, before, after) {
  await AuditLog.create(
    [
      {
        actorId,
        action,
        entity: 'Order',
        entityId,
        before,
        after,
      },
    ],
    { session }
  );
}

async function refundOrder(session, order, { refundBudget = true } = {}) {
  if (refundBudget) {
    const weekStart =
      order.budgetWeekStart || startOfWeekJakarta(order.createdAt);
    const period = await BudgetPeriod.findOne({
      userId: order.userId,
      weekStart,
    }).session(session);

    if (period) {
      period.consumedGrams = Math.max(
        0,
        (period.consumedGrams || 0) - order.totalSugarGrams
      );
      period.orderCount = Math.max(0, (period.orderCount || 0) - 1);
      await period.save({ session });
    }
  }

  for (const item of order.items) {
    await DailyStock.updateOne(
      {
        locationId: order.pickup.locationId,
        productId: item.productId,
        date: order.pickup.date,
        reserved: { $gte: item.qty },
      },
      { $inc: { reserved: -item.qty } },
      { session }
    );
  }

  await PickupSlot.updateOne(
    {
      locationId: order.pickup.locationId,
      date: order.pickup.date,
      startTime: order.pickup.slotStart,
      booked: { $gt: 0 },
    },
    { $inc: { booked: -1 } },
    { session }
  );
}

async function releaseStockAsSold(session, order) {
  for (const item of order.items) {
    const result = await DailyStock.updateOne(
      {
        locationId: order.pickup.locationId,
        productId: item.productId,
        date: order.pickup.date,
        reserved: { $gte: item.qty },
      },
      { $inc: { reserved: -item.qty, sold: item.qty } },
      { session }
    );

    if (result.matchedCount === 0) {
      throw httpError(409, 'Stok order tidak konsisten', 'STOCK_INCONSISTENT');
    }
  }

  await PickupSlot.updateOne(
    {
      locationId: order.pickup.locationId,
      date: order.pickup.date,
      startTime: order.pickup.slotStart,
      booked: { $gt: 0 },
    },
    { $inc: { booked: -1 } },
    { session }
  );
}

async function createOrder(user, payload = {}) {
  const items = normalizeItems(payload.items);
  const idempotencyKey = String(payload.idempotencyKey || '').trim();

  if (!idempotencyKey) {
    throw httpError(400, 'idempotencyKey wajib diisi', 'IDEMPOTENCY_KEY_REQUIRED');
  }

  const existing = await getOrderLean({ userId: user._id, idempotencyKey });
  if (existing) {
    return { order: serializeOrder(existing), created: false };
  }

  const loaded = await loadProducts(items);
  const subtotal = loaded.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalSugarGrams = loaded.reduce((sum, item) => sum + item.sugarGrams, 0);
  const pickup = await resolvePickup(payload.pickup);
  const period = await getOrCreateBudgetPeriod(user);
  const overBudget = assertBudget(
    user,
    period,
    totalSugarGrams,
    Boolean(payload.budgetOverride)
  );
  const code = await uniqueCode();

  const session = await mongoose.startSession();
  let createdOrder = null;

  try {
    await session.withTransaction(async () => {
      const periodTx = await BudgetPeriod.findById(period._id).session(session);
      if (!periodTx) {
        throw httpError(409, 'Budget periode tidak ditemukan', 'BUDGET_NOT_FOUND');
      }

      assertBudget(user, periodTx, totalSugarGrams, Boolean(payload.budgetOverride));

      for (const item of loaded) {
        const stock = await DailyStock.findOneAndUpdate(
          {
            locationId: pickup.locationId,
            productId: item.product._id,
            date: pickup.date,
            $expr: {
              $lte: [
                { $add: ['$reserved', '$sold', item.qty] },
                '$total',
              ],
            },
          },
          { $inc: { reserved: item.qty } },
          { returnDocument: 'after', session }
        );

        if (!stock) {
          throw httpError(
            409,
            `Stok ${item.product.name} tidak cukup`,
            'OUT_OF_STOCK'
          );
        }
      }

      const slot = await PickupSlot.findOneAndUpdate(
        {
          locationId: pickup.locationId,
          date: pickup.date,
          startTime: pickup.slotStart,
          active: true,
          $expr: { $lt: ['$booked', '$capacity'] },
        },
        { $inc: { booked: 1 } },
        { returnDocument: 'after', session }
      );

      if (!slot) {
        throw httpError(409, 'Slot pickup sudah penuh', 'SLOT_FULL');
      }

      periodTx.consumedGrams = (periodTx.consumedGrams || 0) + totalSugarGrams;
      periodTx.orderCount = (periodTx.orderCount || 0) + 1;
      await periodTx.save({ session });

      const docs = await Order.create(
        [
          {
            code,
            userId: user._id,
            items: loaded.map((item) => ({
              productId: item.product._id,
              name: item.product.name,
              price: item.product.price,
              qty: item.qty,
              sugarGrams: item.product.sugar * item.qty,
              lineTotal: item.lineTotal,
            })),
            subtotal,
            totalSugarGrams,
            budgetWeekStart: periodTx.weekStart,
            pickup: {
              locationId: pickup.locationId,
              date: pickup.date,
              slotStart: pickup.slotStart,
              slotEnd: pickup.slotEnd,
            },
            status: 'pending_payment',
            payment: {
              method:
                payload.paymentMethod === 'qris_manual'
                  ? 'qris_manual'
                  : 'pay_at_pickup',
            },
            idempotencyKey,
            budgetOverride: overBudget,
            notes: payload.notes ? String(payload.notes).slice(0, 500) : '',
          },
        ],
        { session }
      );

      createdOrder = docs[0];
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await getOrderLean({ userId: user._id, idempotencyKey });
      if (duplicate) {
        return { order: serializeOrder(duplicate), created: false };
      }
    }
    throw error;
  } finally {
    await session.endSession();
  }

  const lean = await getOrderLean({ _id: createdOrder._id });
  return { order: serializeOrder(lean), created: true };
}

async function listUserOrders(user, query = {}) {
  const { page, limit, skip } = parsePagination(query, {
    defaultLimit: 10,
    maxLimit: 20,
  });
  const statusFilter = resolveOrderStatusFilter(query.status);
  const filter = { userId: user._id };
  if (statusFilter) filter.status = statusFilter;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('pickup.locationId', 'name address city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    orders: orders.map(serializeOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

async function getOrderByCode(user, code) {
  const order = await getOrderLean({ code: String(code).toUpperCase().trim() });
  if (!order) {
    throw httpError(404, 'Order tidak ditemukan', 'ORDER_NOT_FOUND');
  }

  const isOwner = String(order.userId?._id || order.userId) === String(user._id);
  if (!isOwner && !['staff', 'admin'].includes(user.role)) {
    throw httpError(403, 'Akses order ditolak', 'FORBIDDEN');
  }

  return serializeOrder(order);
}

async function cancelOrder(user, orderId) {
  const session = await mongoose.startSession();
  let canceled = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        userId: user._id,
      }).session(session);

      if (!order) {
        throw httpError(404, 'Order tidak ditemukan', 'ORDER_NOT_FOUND');
      }
      if (order.status !== 'pending_payment') {
        throw httpError(
          409,
          'Order hanya bisa dibatalkan saat menunggu pembayaran',
          'ORDER_NOT_CANCELABLE'
        );
      }

      const before = { status: order.status };
      order.status = 'canceled';
      order.canceledAt = new Date();
      await order.save({ session });

      await refundOrder(session, order, { refundBudget: true });
      await audit(session, user._id, 'order.canceled', order._id, before, {
        status: order.status,
      });

      canceled = order;
    });
  } finally {
    await session.endSession();
  }

  const lean = await getOrderLean({ _id: canceled._id });
  return serializeOrder(lean);
}

async function updateOrderStatus(actor, orderId, newStatus) {
  const session = await mongoose.startSession();
  let updated = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw httpError(404, 'Order tidak ditemukan', 'ORDER_NOT_FOUND');
      }

      const allowed = TRANSITIONS[order.status] || [];
      if (!allowed.includes(newStatus)) {
        throw httpError(
          409,
          `Transisi status tidak valid: ${order.status} → ${newStatus}`,
          'INVALID_STATUS_TRANSITION'
        );
      }

      const before = { status: order.status };

      if (newStatus === 'picked_up') {
        await releaseStockAsSold(session, order);
        order.pickedUpAt = new Date();
        if (!order.payment.paidAt) order.payment.paidAt = new Date();
      }

      if (newStatus === 'canceled') {
        await refundOrder(session, order, { refundBudget: true });
        order.canceledAt = new Date();
      }

      if (newStatus === 'expired') {
        if (order.status === 'pending_payment') {
          await refundOrder(session, order, { refundBudget: true });
        } else {
          await releaseStockAsSold(session, order);
        }
        order.expiredAt = new Date();
      }

      if (newStatus === 'paid') {
        order.payment.paidAt = new Date();
        order.payment.confirmedBy = actor._id;
      }

      order.status = newStatus;
      await order.save({ session });

      await audit(session, actor._id, `order.${newStatus}`, order._id, before, {
        status: newStatus,
      });

      updated = order;
    });
  } finally {
    await session.endSession();
  }

  const lean = await getOrderLean({ _id: updated._id });
  return serializeOrder(lean);
}

async function listAdminOrders(query = {}) {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.date) filter['pickup.date'] = query.date;
  if (query.locationId) filter['pickup.locationId'] = query.locationId;

  const orders = await Order.find(filter)
    .populate('pickup.locationId', 'name address city')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return orders.map(serializeOrder);
}

async function listAdminStock(locationId, date) {
  const resolvedLocationId = await resolveLocationId(locationId);
  const stockDate = date || isoDateJakarta();

  const products = await Product.find({ active: true }).sort({ name: 1 });
  const stocks = await DailyStock.find({
    locationId: resolvedLocationId,
    date: stockDate,
  }).lean();
  const byProduct = new Map(
    stocks.map((stock) => [String(stock.productId), stock])
  );

  return {
    date: stockDate,
    locationId: resolvedLocationId,
    products: products.map((product) => {
      const stock = byProduct.get(String(product._id));
      return {
        productId: product._id,
        name: product.name,
        sugarGrams: product.sugar,
        total: stock?.total || 0,
        reserved: stock?.reserved || 0,
        sold: stock?.sold || 0,
        available: Math.max(
          0,
          (stock?.total || 0) - (stock?.reserved || 0) - (stock?.sold || 0)
        ),
      };
    }),
  };
}

async function setStock(actor, productId, payload = {}) {
  const resolvedLocationId = await resolveLocationId(payload.locationId);
  const date = payload.date || isoDateJakarta();
  const total = Number(payload.total);

  if (!Number.isInteger(total) || total < 0) {
    throw httpError(400, 'Total stok harus bilangan bulat >= 0', 'INVALID_STOCK');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw httpError(404, 'Produk tidak ditemukan', 'PRODUCT_NOT_FOUND');
  }

  let stock = await DailyStock.findOne({
    locationId: resolvedLocationId,
    productId,
    date,
  });

  if (!stock) {
    stock = await DailyStock.create({
      locationId: resolvedLocationId,
      productId,
      date,
      total,
      reserved: 0,
      sold: 0,
    });
  } else {
    if (total < stock.reserved + stock.sold) {
      throw httpError(
        409,
        `Total stok tidak boleh kurang dari reserved+sold (${stock.reserved + stock.sold})`,
        'STOCK_BELOW_RESERVED'
      );
    }
    stock.total = total;
    await stock.save();
  }

  await AuditLog.create({
    actorId: actor._id,
    action: 'stock.updated',
    entity: 'DailyStock',
    entityId: stock._id,
    before: null,
    after: { productId, date, total },
  });

  return {
    productId,
    date,
    total: stock.total,
    reserved: stock.reserved,
    sold: stock.sold,
    available: Math.max(0, stock.total - stock.reserved - stock.sold),
  };
}

module.exports = {
  TRANSITIONS,
  createOrder,
  listUserOrders,
  getOrderByCode,
  cancelOrder,
  updateOrderStatus,
  listAdminOrders,
  listAdminStock,
  setStock,
};
