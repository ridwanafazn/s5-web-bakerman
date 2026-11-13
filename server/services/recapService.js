const BudgetPeriod = require('../models/BudgetPeriod');
const Order = require('../models/Order');
const StravaActivity = require('../models/StravaActivity');
const { getOrCreateBudgetPeriod } = require('./budgetService');
const {
  DAY_MS,
  startOfWeekJakarta,
  endOfWeekJakarta,
} = require('../utils/time');
const { bonusForMinutes } = require('../utils/sugar');

const ACTIVE_STATUSES = ['pending_payment', 'paid', 'preparing', 'ready'];
const CLOSED_STATUSES = ['canceled', 'expired'];

function weekKey(value) {
  return new Date(value).toISOString();
}

function buildBuckets(currentWeekStart, weeks) {
  const firstWeekStart = new Date(
    currentWeekStart.getTime() - (weeks - 1) * 7 * DAY_MS
  );
  const buckets = [];

  for (let index = 0; index < weeks; index += 1) {
    const weekStart = new Date(firstWeekStart.getTime() + index * 7 * DAY_MS);
    buckets.push({
      weekStart,
      weekEnd: endOfWeekJakarta(weekStart),
      period: null,
      orders: [],
      activities: [],
    });
  }

  return { firstWeekStart, buckets };
}

function topProductsFor(orders, limit = 3) {
  const products = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const key = String(item.productId || item.name);
      const current = products.get(key) || {
        productId: item.productId,
        name: item.name,
        qty: 0,
        sugarGrams: 0,
      };
      current.qty += item.qty || 0;
      current.sugarGrams += item.sugarGrams || 0;
      products.set(key, current);
    }
  }

  return [...products.values()]
    .sort((a, b) => b.qty - a.qty || b.sugarGrams - a.sugarGrams)
    .slice(0, limit);
}

function summarizeWeek(bucket, { isCurrentWeek, user }) {
  const { period, orders, activities } = bucket;

  const activeOrders = orders.filter(
    (order) => !CLOSED_STATUSES.includes(order.status)
  );
  const completedOrders = orders.filter(
    (order) => order.status === 'picked_up'
  ).length;
  const inProgressOrders = orders.filter((order) =>
    ACTIVE_STATUSES.includes(order.status)
  ).length;
  const canceledOrders = orders.filter((order) =>
    CLOSED_STATUSES.includes(order.status)
  ).length;

  const sugarFromOrders = activeOrders.reduce(
    (sum, order) => sum + (order.totalSugarGrams || 0),
    0
  );
  const totalSeconds = activities.reduce(
    (sum, activity) => sum + (activity.movingTimeSec || 0),
    0
  );
  const minutes = Math.round(totalSeconds / 60);
  const bonusFromActivity = bonusForMinutes(minutes);

  const baseBudgetGrams = period
    ? period.baseBudgetGrams || 0
    : isCurrentWeek
      ? user.weeklyBudgetGrams || 0
      : 0;
  const consumedGrams = period ? period.consumedGrams || 0 : sugarFromOrders;
  const bonusGrams = period ? period.bonusGrams || 0 : bonusFromActivity;
  const totalGrams = baseBudgetGrams + bonusGrams;
  const remainingGrams = totalGrams - consumedGrams;

  return {
    weekStart: bucket.weekStart,
    weekEnd: bucket.weekEnd,
    baseBudgetGrams,
    bonusGrams,
    consumedGrams,
    totalGrams,
    remainingGrams,
    percentUsed:
      totalGrams > 0 ? Math.round((consumedGrams / totalGrams) * 100) : 0,
    mode: isCurrentWeek ? user.budgetMode : undefined,
    hasData: Boolean(period || orders.length || activities.length),
    orders: {
      total: activeOrders.length,
      completed: completedOrders,
      inProgress: inProgressOrders,
      canceled: canceledOrders,
    },
    sugarFromOrders,
    activity: {
      minutes,
      activities: activities.length,
      bonusGrams: bonusFromActivity,
    },
    topProducts: topProductsFor(activeOrders),
  };
}

async function getWeeklyRecap(user, { weeks = 4, now = new Date() } = {}) {
  const count = Math.min(8, Math.max(1, Number(weeks) || 4));
  const currentWeekStart = startOfWeekJakarta(now);
  const currentPeriod = await getOrCreateBudgetPeriod(user, now);

  const { firstWeekStart, buckets } = buildBuckets(currentWeekStart, count);
  const lastWeekEnd = endOfWeekJakarta(currentWeekStart);

  const [periods, orders, activities] = await Promise.all([
    BudgetPeriod.find({
      userId: user._id,
      weekStart: { $gte: firstWeekStart, $lte: currentWeekStart },
    }).lean(),
    Order.find({
      userId: user._id,
      budgetWeekStart: { $gte: firstWeekStart, $lte: currentWeekStart },
    })
      .select('status items totalSugarGrams budgetWeekStart')
      .lean(),
    StravaActivity.find({
      userId: user._id,
      startDate: { $gte: firstWeekStart, $lte: lastWeekEnd },
      manual: false,
      type: { $ne: 'EBikeRide' },
    })
      .select('movingTimeSec startDate')
      .lean(),
  ]);

  const bucketByKey = new Map(
    buckets.map((bucket) => [weekKey(bucket.weekStart), bucket])
  );

  for (const period of periods) {
    const bucket = bucketByKey.get(weekKey(period.weekStart));
    if (bucket) bucket.period = period;
  }

  // Periode berjalan selalu ada, termasuk saat baru dibuat oleh request ini.
  const currentBucket = bucketByKey.get(weekKey(currentWeekStart));
  if (currentBucket && !currentBucket.period) {
    currentBucket.period = currentPeriod;
  }

  for (const order of orders) {
    const bucket = bucketByKey.get(weekKey(order.budgetWeekStart));
    if (bucket) bucket.orders.push(order);
  }

  for (const activity of activities) {
    const bucket = bucketByKey.get(
      weekKey(startOfWeekJakarta(activity.startDate))
    );
    if (bucket) bucket.activities.push(activity);
  }

  const summarized = buckets.map((bucket, index) =>
    summarizeWeek(bucket, {
      isCurrentWeek: index === buckets.length - 1,
      user,
    })
  );

  const weeksWithData = summarized.filter((week) => week.hasData);
  const sum = (field, nested) =>
    weeksWithData.reduce(
      (total, week) =>
        total + (nested ? week[nested][field] : week[field]) || 0,
      0
    );

  return {
    generatedAt: new Date(),
    weeks: summarized,
    currentWeek: summarized[summarized.length - 1],
    summary: {
      weeks: count,
      weeksWithData: weeksWithData.length,
      onBudgetWeeks: weeksWithData.filter(
        (week) => week.consumedGrams <= week.totalGrams
      ).length,
      totalOrders: sum('total', 'orders'),
      completedOrders: sum('completed', 'orders'),
      totalActiveMinutes: sum('minutes', 'activity'),
      totalBonusGrams: sum('bonusGrams'),
      averageConsumedGrams: weeksWithData.length
        ? Math.round(sum('consumedGrams') / weeksWithData.length)
        : 0,
    },
  };
}

module.exports = {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  getWeeklyRecap,
  topProductsFor,
};
