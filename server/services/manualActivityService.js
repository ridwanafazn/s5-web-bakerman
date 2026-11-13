const ManualActivity = require('../models/ManualActivity');
const stravaService = require('./stravaService');
const cloudinary = require('../utils/cloudinary');
const env = require('../config/env');
const { httpError } = require('../utils/httpError');
const { bonusForMinutes } = require('../utils/sugar');
const {
  startOfWeekJakarta,
  endOfWeekJakarta,
  isoDateJakarta,
} = require('../utils/time');

const ACTIVITY_TYPES = ['Run', 'Ride', 'Walk', 'Hike', 'Workout', 'Other'];

function weekRange(now = new Date()) {
  const weekStart = startOfWeekJakarta(now);
  const weekEnd = endOfWeekJakarta(weekStart);

  return {
    weekStart,
    weekEnd,
    minDate: isoDateJakarta(weekStart),
    maxDate: isoDateJakarta(now),
  };
}

function normalizeDate(date, now = new Date()) {
  const value = String(date || '').trim();
  const { minDate, maxDate } = weekRange(now);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < minDate ||
    value > maxDate
  ) {
    throw httpError(
      400,
      `Tanggal aktivitas harus di minggu ini (${minDate} s/d ${maxDate})`,
      'INVALID_ACTIVITY_DATE'
    );
  }

  return {
    date: value,
    startDate: new Date(`${value}T12:00:00+07:00`),
  };
}

function normalizeMinutes(minutes) {
  const value = Number(minutes);

  if (!Number.isInteger(value) || value < 1 || value > 600) {
    throw httpError(
      400,
      'Durasi harus bilangan bulat 1–600 menit',
      'INVALID_ACTIVITY_MINUTES'
    );
  }

  return value;
}

function normalizeType(type) {
  const value = String(type || '').trim();
  if (!ACTIVITY_TYPES.includes(value)) {
    throw httpError(400, 'Jenis aktivitas tidak valid', 'INVALID_ACTIVITY_TYPE');
  }
  return value;
}

function serializeActivity(activity) {
  const screenshot = activity.screenshot || {};
  const deleteAfter = screenshot.deleteAfter
    ? new Date(screenshot.deleteAfter)
    : null;

  return {
    id: activity._id,
    date: activity.date,
    type: activity.type,
    minutes: activity.minutes,
    note: activity.note || '',
    createdAt: activity.createdAt,
    screenshotUrl: screenshot.secureUrl || '',
    screenshotDeleteAfter: deleteAfter,
    screenshotExpired: Boolean(deleteAfter && deleteAfter <= new Date()),
    screenshotMock: Boolean(screenshot.mock),
  };
}

async function listManualActivities(user, now = new Date()) {
  const { weekStart, weekEnd, minDate, maxDate } = weekRange(now);
  const activities = await ManualActivity.find({
    userId: user._id,
    startDate: { $gte: weekStart, $lte: weekEnd },
  }).sort({ startDate: -1, createdAt: -1 });

  const minutes = activities.reduce(
    (sum, activity) => sum + (activity.minutes || 0),
    0
  );

  return {
    activities: activities.map(serializeActivity),
    minutes,
    bonusGrams: bonusForMinutes(minutes),
    weekStart,
    weekEnd,
    minDate,
    maxDate,
    retentionDays: env.manualActivity.screenshotRetentionDays,
    configured: cloudinary.isConfigured(),
    mock: cloudinary.isMock(),
    types: ACTIVITY_TYPES,
  };
}

async function createManualActivity(user, payload, file, now = new Date()) {
  if (!cloudinary.isConfigured()) {
    throw httpError(
      503,
      'Upload bukti belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }

  if (!file || !file.buffer) {
    throw httpError(
      400,
      'Screenshot bukti aktivitas wajib diunggah',
      'SCREENSHOT_REQUIRED'
    );
  }

  const { date, startDate } = normalizeDate(payload.date, now);
  const minutes = normalizeMinutes(payload.minutes);
  const type = normalizeType(payload.type);
  const note = String(payload.note || '').trim().slice(0, 300);

  const uploaded = await cloudinary.uploadScreenshot(file.buffer, {
    userId: String(user._id),
  });

  let activity;

  try {
    activity = await ManualActivity.create({
      userId: user._id,
      date,
      startDate,
      type,
      minutes,
      note,
      screenshot: {
        publicId: uploaded.publicId,
        secureUrl: uploaded.secureUrl,
        deleteAfter: new Date(
          Date.now() +
            env.manualActivity.screenshotRetentionDays * 24 * 60 * 60 * 1000
        ),
        uploadedAt: new Date(),
        mock: uploaded.mock,
      },
    });
  } catch (error) {
    await cloudinary.deleteScreenshot(uploaded.publicId).catch(() => {});
    throw error;
  }

  await stravaService.recalculateBonus(user, now);

  return {
    activity: serializeActivity(activity),
    status: await stravaService.status(user),
  };
}

async function deleteManualActivity(user, activityId, now = new Date()) {
  const activity = await ManualActivity.findOne({
    _id: activityId,
    userId: user._id,
  });

  if (!activity) {
    throw httpError(404, 'Aktivitas manual tidak ditemukan', 'ACTIVITY_NOT_FOUND');
  }

  if (activity.screenshot?.publicId) {
    await cloudinary.deleteScreenshot(activity.screenshot.publicId);
  }

  await ManualActivity.deleteOne({ _id: activity._id });
  await stravaService.recalculateBonus(user, now);

  return {
    deleted: true,
    status: await stravaService.status(user),
  };
}

async function cleanupExpiredScreenshots(now = new Date()) {
  if (!cloudinary.isConfigured()) {
    return { scanned: 0, deleted: 0, failed: 0, skipped: 'not_configured' };
  }

  const activities = await ManualActivity.find({
    'screenshot.publicId': { $exists: true, $ne: '' },
    'screenshot.deleteAfter': { $lte: now },
  })
    .select('_id screenshot')
    .limit(100);

  let deleted = 0;
  let failed = 0;

  for (const activity of activities) {
    try {
      await cloudinary.deleteScreenshot(activity.screenshot.publicId);
      await ManualActivity.updateOne(
        { _id: activity._id },
        {
          $set: {
            'screenshot.publicId': '',
            'screenshot.secureUrl': '',
          },
        }
      );
      deleted += 1;
    } catch (error) {
      failed += 1;
      console.error('[CLOUDINARY CLEANUP]', activity._id, error.message);
    }
  }

  return { scanned: activities.length, deleted, failed };
}

module.exports = {
  ACTIVITY_TYPES,
  weekRange,
  normalizeDate,
  normalizeMinutes,
  normalizeType,
  serializeActivity,
  listManualActivities,
  createManualActivity,
  deleteManualActivity,
  cleanupExpiredScreenshots,
};
