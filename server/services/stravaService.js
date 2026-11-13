const crypto = require('crypto');

const env = require('../config/env');
const User = require('../models/User');
const StravaActivity = require('../models/StravaActivity');
const ManualActivity = require('../models/ManualActivity');
const { getOrCreateBudgetPeriod } = require('./budgetService');
const { httpError } = require('../utils/httpError');
const { encrypt, decrypt, signState, verifyState } = require('../utils/crypto');
const { bonusForMinutes, BONUS_TIERS } = require('../utils/sugar');
const { startOfWeekJakarta, endOfWeekJakarta } = require('../utils/time');

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_URL = 'https://www.strava.com/api/v3';

function isConfigured() {
  return Boolean(env.strava.clientId && env.strava.clientSecret);
}

function demoEnabled() {
  return Boolean(env.strava.demoMode);
}

function weekBounds(now = new Date()) {
  const weekStart = startOfWeekJakarta(now);
  const weekEnd = endOfWeekJakarta(weekStart);
  return { weekStart, weekEnd };
}

async function getWeekActivities(user, now = new Date()) {
  const { weekStart, weekEnd } = weekBounds(now);

  return StravaActivity.find({
    userId: user._id,
    startDate: { $gte: weekStart, $lte: weekEnd },
    manual: false,
    type: { $ne: 'EBikeRide' },
  }).sort({ startDate: -1 });
}

async function getWeekTotals(user, now = new Date()) {
  const { weekStart, weekEnd } = weekBounds(now);

  const [activities, manualActivities] = await Promise.all([
    getWeekActivities(user, now),
    ManualActivity.find({
      userId: user._id,
      startDate: { $gte: weekStart, $lte: weekEnd },
    }).sort({ startDate: -1 }),
  ]);

  const stravaSeconds = activities.reduce(
    (sum, activity) => sum + (activity.movingTimeSec || 0),
    0
  );
  const stravaMinutes = Math.round(stravaSeconds / 60);
  const manualMinutes = manualActivities.reduce(
    (sum, activity) => sum + (activity.minutes || 0),
    0
  );

  return {
    weekStart,
    weekEnd,
    activities,
    manualActivities,
    stravaMinutes,
    manualMinutes,
    minutes: stravaMinutes + manualMinutes,
    activityCount: activities.length + manualActivities.length,
    demoActivities: activities.filter((activity) => activity.activityId < 0).length,
  };
}

async function recalculateBonus(user, now = new Date()) {
  const period = await getOrCreateBudgetPeriod(user, now);
  const totals = await getWeekTotals(user, now);
  const bonusGrams = bonusForMinutes(totals.minutes);

  period.bonusGrams = bonusGrams;
  await period.save();

  return {
    period,
    minutes: totals.minutes,
    bonusGrams,
    activityCount: totals.activityCount,
  };
}

async function buildStatus(user, period) {
  const currentPeriod = period || (await getOrCreateBudgetPeriod(user));
  const totals = await getWeekTotals(user);
  const { weekStart, weekEnd } = weekBounds();

  return {
    configured: isConfigured(),
    demoMode: demoEnabled(),
    connected: Boolean(user.strava && user.strava.athleteId),
    athleteName: user.strava?.athleteName || '',
    lastSyncAt: user.strava?.lastSyncAt || null,
    minutes: totals.minutes,
    stravaMinutes: totals.stravaMinutes,
    manualMinutes: totals.manualMinutes,
    bonusGrams: currentPeriod.bonusGrams || 0,
    activities: totals.activityCount,
    stravaActivities: totals.activities.length,
    manualActivities: totals.manualActivities.length,
    demoActivities: totals.demoActivities,
    tiers: BONUS_TIERS,
    weekStart,
    weekEnd,
  };
}

async function getConnectUrl(user) {
  if (!isConfigured()) {
    throw httpError(
      503,
      'Strava belum dikonfigurasi. Isi STRAVA_CLIENT_ID dan STRAVA_CLIENT_SECRET.',
      'STRAVA_NOT_CONFIGURED'
    );
  }

  const state = signState({
    userId: user._id.toString(),
    exp: Date.now() + 10 * 60 * 1000,
    nonce: crypto.randomBytes(8).toString('hex'),
  });

  const params = new URLSearchParams({
    client_id: env.strava.clientId,
    redirect_uri: env.strava.redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state,
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

async function requestToken(payload) {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw httpError(
      502,
      data.message || 'Gagal menukar token Strava',
      'STRAVA_TOKEN_FAILED'
    );
  }

  return data;
}

async function handleCallback(code, state) {
  if (!isConfigured()) {
    throw httpError(503, 'Strava belum dikonfigurasi', 'STRAVA_NOT_CONFIGURED');
  }
  if (!code) {
    throw httpError(400, 'Kode OAuth Strava tidak ada', 'STRAVA_CODE_MISSING');
  }

  const payload = verifyState(state);
  const user = await User.findById(payload.userId);
  if (!user) {
    throw httpError(404, 'User tidak ditemukan', 'USER_NOT_FOUND');
  }

  const token = await requestToken({
    client_id: env.strava.clientId,
    client_secret: env.strava.clientSecret,
    code,
    grant_type: 'authorization_code',
  });

  const athlete = token.athlete || {};
  if (!athlete.id || !token.refresh_token) {
    throw httpError(
      502,
      'Respons Strava tidak lengkap (athlete/refresh token)',
      'STRAVA_BAD_RESPONSE'
    );
  }

  user.strava = {
    athleteId: athlete.id,
    athleteName: [athlete.firstname, athlete.lastname].filter(Boolean).join(' '),
    accessToken: encrypt(token.access_token),
    refreshToken: encrypt(token.refresh_token),
    expiresAt: new Date(token.expires_at * 1000),
    scope: token.scope || 'read,activity:read_all',
    connectedAt: new Date(),
  };
  await user.save();

  const result = await recalculateBonus(user);
  return { user, ...result };
}

async function getAccessToken(user) {
  if (!user.strava || !user.strava.refreshToken) {
    throw httpError(409, 'Strava belum terhubung', 'STRAVA_NOT_CONNECTED');
  }

  if (
    user.strava.accessToken &&
    user.strava.expiresAt &&
    user.strava.expiresAt.getTime() > Date.now() + 60_000
  ) {
    return decrypt(user.strava.accessToken);
  }

  const refreshToken = decrypt(user.strava.refreshToken);
  const data = await requestToken({
    client_id: env.strava.clientId,
    client_secret: env.strava.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  user.strava.accessToken = encrypt(data.access_token);
  user.strava.refreshToken = encrypt(data.refresh_token || refreshToken);
  user.strava.expiresAt = new Date(data.expires_at * 1000);
  await user.save();

  return data.access_token;
}

async function fetchActivities(user) {
  const accessToken = await getAccessToken(user);
  const { weekStart, weekEnd } = weekBounds();
  const after = Math.floor(weekStart.getTime() / 1000);
  const before = Math.floor(weekEnd.getTime() / 1000);
  const url = `${STRAVA_API_URL}/athlete/activities?after=${after}&before=${before}&per_page=100`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw httpError(
      502,
      data.message || 'Gagal mengambil aktivitas Strava',
      'STRAVA_FETCH_FAILED'
    );
  }

  return Array.isArray(data) ? data : [];
}

async function syncActivities(user) {
  if (!user.strava || !user.strava.athleteId) {
    throw httpError(409, 'Strava belum terhubung', 'STRAVA_NOT_CONNECTED');
  }

  const activities = await fetchActivities(user);
  let imported = 0;

  for (const activity of activities) {
    if (activity.manual || activity.type === 'EBikeRide') continue;

    await StravaActivity.findOneAndUpdate(
      { userId: user._id, activityId: activity.id },
      {
        $set: {
          name: activity.name || '',
          type: activity.type || '',
          movingTimeSec: activity.moving_time || 0,
          distanceMeters: activity.distance || 0,
          startDate: new Date(activity.start_date),
          manual: Boolean(activity.manual),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    imported += 1;
  }

  user.strava.lastSyncAt = new Date();
  await user.save();

  const result = await recalculateBonus(user);
  return { ...(await buildStatus(user, result.period)), imported };
}

async function addDemoActivity(user) {
  if (!demoEnabled()) {
    throw httpError(403, 'Mode simulasi Strava tidak aktif', 'STRAVA_DEMO_DISABLED');
  }

  const activityId =
    -Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 10_000);

  await StravaActivity.create({
    userId: user._id,
    activityId,
    name: 'Demo run 5K',
    type: 'Run',
    movingTimeSec: 45 * 60,
    distanceMeters: 5000,
    startDate: new Date(),
    manual: false,
  });

  const result = await recalculateBonus(user);
  return buildStatus(user, result.period);
}

async function resetDemo(user) {
  await StravaActivity.deleteMany({ userId: user._id, activityId: { $lt: 0 } });
  const result = await recalculateBonus(user);
  return buildStatus(user, result.period);
}

async function disconnect(user) {
  await StravaActivity.deleteMany({ userId: user._id });
  user.strava = undefined;
  await user.save();

  const result = await recalculateBonus(user);
  return buildStatus(user, result.period);
}

module.exports = {
  isConfigured,
  demoEnabled,
  weekBounds,
  recalculateBonus,
  getConnectUrl,
  handleCallback,
  syncActivities,
  addDemoActivity,
  resetDemo,
  disconnect,
  status: (user) => buildStatus(user),
};
