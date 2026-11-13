const test = require('node:test');
const assert = require('node:assert/strict');

const { topProductsFor } = require('../services/recapService');

test('topProductsFor aggregates qty and sugar across orders', () => {
  const orders = [
    {
      items: [
        { productId: 'a', name: 'Roti Susu', qty: 2, sugarGrams: 16 },
        { productId: 'b', name: 'Cake', qty: 1, sugarGrams: 35 },
      ],
    },
    {
      items: [{ productId: 'a', name: 'Roti Susu', qty: 1, sugarGrams: 8 }],
    },
  ];

  const top = topProductsFor(orders);

  assert.equal(top.length, 2);
  assert.equal(top[0].name, 'Roti Susu');
  assert.equal(top[0].qty, 3);
  assert.equal(top[0].sugarGrams, 24);
  assert.equal(top[1].name, 'Cake');
});

test('topProductsFor respects limit and ignores empty items', () => {
  const orders = [
    { items: [] },
    {
      items: [
        { productId: 'a', name: 'A', qty: 1, sugarGrams: 5 },
        { productId: 'b', name: 'B', qty: 2, sugarGrams: 10 },
        { productId: 'c', name: 'C', qty: 3, sugarGrams: 15 },
      ],
    },
  ];

  const top = topProductsFor(orders, 2);

  assert.equal(top.length, 2);
  assert.deepEqual(
    top.map((item) => item.name),
    ['C', 'B']
  );
});
