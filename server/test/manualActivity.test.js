const test = require('node:test');
const assert = require('node:assert/strict');

const {
  weekRange,
  normalizeDate,
  normalizeMinutes,
  normalizeType,
  serializeActivity,
} = require('../services/manualActivityService');

const NOW = new Date('2026-11-14T10:00:00.000Z');

test('weekRange returns current Jakarta week and date limits', () => {
  const range = weekRange(NOW);
  assert.equal(range.minDate, '2026-11-09');
  assert.equal(range.maxDate, '2026-11-14');
});

test('normalizeDate accepts current week and rejects outside range', () => {
  const value = normalizeDate('2026-11-10', NOW);
  assert.equal(value.date, '2026-11-10');
  assert.equal(value.startDate.toISOString(), '2026-11-10T05:00:00.000Z');

  assert.throws(
    () => normalizeDate('2026-11-08', NOW),
    (error) => error.code === 'INVALID_ACTIVITY_DATE'
  );
  assert.throws(
    () => normalizeDate('2026-11-15', NOW),
    (error) => error.code === 'INVALID_ACTIVITY_DATE'
  );
});

test('normalizeMinutes enforces 1-600 integer minutes', () => {
  assert.equal(normalizeMinutes('45'), 45);
  assert.equal(normalizeMinutes(600), 600);
  assert.throws(
    () => normalizeMinutes(0),
    (error) => error.code === 'INVALID_ACTIVITY_MINUTES'
  );
  assert.throws(
    () => normalizeMinutes(601),
    (error) => error.code === 'INVALID_ACTIVITY_MINUTES'
  );
  assert.throws(
    () => normalizeMinutes('12.5'),
    (error) => error.code === 'INVALID_ACTIVITY_MINUTES'
  );
});

test('normalizeType rejects unknown activity types', () => {
  assert.equal(normalizeType('Run'), 'Run');
  assert.throws(
    () => normalizeType('Swim'),
    (error) => error.code === 'INVALID_ACTIVITY_TYPE'
  );
});

test('serializeActivity hides publicId and computes screenshot expiry', () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const activity = serializeActivity({
    _id: 'abc',
    date: '2026-11-14',
    type: 'Run',
    minutes: 45,
    note: 'Pagi',
    createdAt: new Date(),
    screenshot: {
      publicId: 'secret-public-id',
      secureUrl: 'https://example.com/shot.jpg',
      deleteAfter: future,
      mock: false,
    },
  });

  assert.equal(activity.screenshotUrl, 'https://example.com/shot.jpg');
  assert.equal(activity.screenshotExpired, false);
  assert.equal(activity.screenshotMock, false);
  assert.equal(Object.prototype.hasOwnProperty.call(activity, 'publicId'), false);
});
