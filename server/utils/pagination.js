const { httpError } = require('./httpError');

const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'picked_up',
  'canceled',
  'expired',
];

const ORDER_STATUS_GROUPS = {
  active: ['pending_payment', 'paid', 'preparing', 'ready'],
  completed: ['picked_up'],
  canceled: ['canceled', 'expired'],
};

function parseInteger(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === '') return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
}

function parsePagination(query = {}, { defaultLimit = 10, maxLimit = 20 } = {}) {
  const page = parseInteger(query.page, 1, { min: 1, max: 100_000 });
  const limit = parseInteger(query.limit, defaultLimit, { min: 1, max: maxLimit });

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function resolveOrderStatusFilter(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (!normalized || normalized === 'all') return null;

  if (ORDER_STATUS_GROUPS[normalized]) {
    return { $in: ORDER_STATUS_GROUPS[normalized] };
  }

  if (ORDER_STATUSES.includes(normalized)) return normalized;

  throw httpError(400, 'Filter status order tidak valid', 'INVALID_STATUS_FILTER');
}

module.exports = {
  ORDER_STATUSES,
  ORDER_STATUS_GROUPS,
  parseInteger,
  parsePagination,
  resolveOrderStatusFilter,
};
