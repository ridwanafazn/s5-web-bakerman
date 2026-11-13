const Product = require('../models/Product');
const Location = require('../models/Location');
const DailyStock = require('../models/DailyStock');
const PickupSlot = require('../models/PickupSlot');
const { isoDateJakarta } = require('../utils/time');
const { httpError } = require('../utils/httpError');

function publicProduct(product, stock) {
  const item = {
    id: product._id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    sugarGrams: product.sugar,
    sugarLevel: product.sugarLevel,
    category: product.category,
    tags: product.tags || [],
    allergens: product.allergens || [],
    ingredients: product.ingredients || [],
    image: product.image,
    active: product.active,
  };

  if (stock) {
    item.stock = {
      total: stock.total,
      reserved: stock.reserved,
      sold: stock.sold,
      available: Math.max(0, stock.total - stock.reserved - stock.sold),
    };
  }

  return item;
}

async function listProducts(query = {}) {
  const filter = { active: true };

  if (query.category) filter.category = query.category;
  if (query.tag) filter.tags = query.tag;
  if (query.sugarLevel) filter.sugarLevel = query.sugarLevel;

  const maxSugar = Number(query.maxSugar);
  if (Number.isFinite(maxSugar) && maxSugar >= 0) {
    filter.sugar = { $lte: maxSugar };
  }

  const products = await Product.find(filter).sort({ sugar: 1, name: 1 }).limit(100);
  return products.map((product) => publicProduct(product));
}

async function getProductBySlug(slug) {
  const product = await Product.findOne({ slug, active: true });
  if (!product) {
    throw httpError(404, 'Produk tidak ditemukan', 'PRODUCT_NOT_FOUND');
  }

  const locationId = await resolveLocationId();
  const stock = await DailyStock.findOne({
    locationId,
    productId: product._id,
    date: isoDateJakarta(),
  });

  return publicProduct(product, stock);
}

async function listLocations() {
  const locations = await Location.find({ active: true }).sort({ name: 1 });
  return locations.map((location) => ({
    id: location._id,
    name: location.name,
    address: location.address,
    city: location.city,
    timezone: location.timezone,
  }));
}

async function resolveLocationId(locationId) {
  if (locationId) return locationId;

  const location = await Location.findOne({ active: true }).sort({ createdAt: 1 });
  if (!location) {
    throw httpError(404, 'Belum ada outlet aktif', 'LOCATION_NOT_FOUND');
  }
  return location._id;
}

async function menuToday(locationId) {
  const resolvedLocationId = await resolveLocationId(locationId);
  const date = isoDateJakarta();

  const products = await Product.find({ active: true }).sort({ sugar: 1, name: 1 });
  const stocks = await DailyStock.find({
    locationId: resolvedLocationId,
    date,
  });
  const stockByProduct = new Map(
    stocks.map((stock) => [String(stock.productId), stock])
  );

  return {
    date,
    locationId: resolvedLocationId,
    products: products.map((product) =>
      publicProduct(product, stockByProduct.get(String(product._id)))
    ),
  };
}

async function listPickupSlots(locationId, date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw httpError(400, 'Tanggal tidak valid (YYYY-MM-DD)', 'INVALID_DATE');
  }

  const resolvedLocationId = await resolveLocationId(locationId);
  const slots = await PickupSlot.find({
    locationId: resolvedLocationId,
    date,
    active: true,
  }).sort({ startTime: 1 });

  return slots.map((slot) => ({
    id: slot._id,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity: slot.capacity,
    booked: slot.booked,
    available: Math.max(0, slot.capacity - slot.booked),
  }));
}

module.exports = {
  publicProduct,
  listProducts,
  getProductBySlug,
  listLocations,
  resolveLocationId,
  menuToday,
  listPickupSlots,
};
