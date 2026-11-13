const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parsePagination,
  resolveOrderStatusFilter,
} = require('../utils/pagination');

test('parsePagination uses defaults', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 10, skip: 0 });
});

test('parsePagination clamps page and limit', () => {
  assert.deepEqual(parsePagination({ page: 3, limit: 50 }), {
    page: 3,
    limit: 20,
    skip: 40,
  });
  assert.deepEqual(parsePagination({ page: 0, limit: 0 }), {
    page: 1,
    limit: 1,
    skip: 0,
  });
});

test('parsePagination ignores invalid values', () => {
  assert.deepEqual(parsePagination({ page: 'abc', limit: '2.5' }), {
    page: 1,
    limit: 10,
    skip: 0,
  });
});

test('resolveOrderStatusFilter maps groups', () => {
  assert.deepEqual(resolveOrderStatusFilter('active'), {
    $in: ['pending_payment', 'paid', 'preparing', 'ready'],
  });
  assert.deepEqual(resolveOrderStatusFilter('completed'), {
    $in: ['picked_up'],
  });
  assert.deepEqual(resolveOrderStatusFilter('canceled'), {
    $in: ['canceled', 'expired'],
  });
  assert.equal(resolveOrderStatusFilter('all'), null);
  assert.equal(resolveOrderStatusFilter(''), null);
});

test('resolveOrderStatusFilter accepts exact status', () => {
  assert.equal(resolveOrderStatusFilter('ready'), 'ready');
  assert.equal(resolveOrderStatusFilter('PICKED_UP'), 'picked_up');
});

test('resolveOrderStatusFilter rejects unknown status', () => {
  assert.throws(
    () => resolveOrderStatusFilter('unknown'),
    (error) => error.status === 400 && error.code === 'INVALID_STATUS_FILTER'
  );
});
