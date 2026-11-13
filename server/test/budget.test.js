const test = require('node:test');
const assert = require('node:assert/strict');

const {
  startOfWeekJakarta,
  endOfWeekJakarta,
  isoDateJakarta,
} = require('../utils/time');
const {
  bonusForMinutes,
  sugarLevelFor,
  budgetForPreset,
} = require('../utils/sugar');

test('startOfWeekJakarta returns Monday 00:00 Jakarta', () => {
  const friday = new Date('2026-11-13T10:00:00.000Z');
  const start = startOfWeekJakarta(friday);
  assert.equal(start.toISOString(), '2026-11-08T17:00:00.000Z');
});

test('endOfWeekJakarta is 7 days minus 1 ms after start', () => {
  const start = startOfWeekJakarta(new Date('2026-11-13T10:00:00.000Z'));
  const end = endOfWeekJakarta(start);
  assert.equal(end.getTime() - start.getTime(), 7 * 24 * 60 * 60 * 1000 - 1);
});

test('isoDateJakarta uses Jakarta date', () => {
  assert.equal(isoDateJakarta(new Date('2026-11-12T18:00:00.000Z')), '2026-11-13');
});

test('bonusForMinutes follows progressive tiers', () => {
  assert.equal(bonusForMinutes(0), 0);
  assert.equal(bonusForMinutes(29), 0);
  assert.equal(bonusForMinutes(30), 10);
  assert.equal(bonusForMinutes(59), 10);
  assert.equal(bonusForMinutes(60), 20);
  assert.equal(bonusForMinutes(89), 20);
  assert.equal(bonusForMinutes(90), 30);
  assert.equal(bonusForMinutes(149), 30);
  assert.equal(bonusForMinutes(150), 45);
  assert.equal(bonusForMinutes(500), 45);
});

test('sugarLevelFor boundaries', () => {
  assert.equal(sugarLevelFor(0), 'light');
  assert.equal(sugarLevelFor(10), 'light');
  assert.equal(sugarLevelFor(11), 'balanced');
  assert.equal(sugarLevelFor(20), 'balanced');
  assert.equal(sugarLevelFor(21), 'indulgent');
  assert.equal(sugarLevelFor(35), 'indulgent');
  assert.equal(sugarLevelFor(36), 'extra');
});

test('budgetForPreset returns gram budgets', () => {
  assert.equal(budgetForPreset('santai'), 120);
  assert.equal(budgetForPreset('seimbang'), 90);
  assert.equal(budgetForPreset('ketat'), 60);
  assert.equal(budgetForPreset('unknown'), 90);
});
