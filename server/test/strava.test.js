const test = require('node:test');
const assert = require('node:assert/strict');

const { encrypt, decrypt, signState, verifyState } = require('../utils/crypto');

test('encrypt/decrypt roundtrip', () => {
  const plain = 'strava-access-token-123';
  const cipher = encrypt(plain);

  assert.notEqual(cipher, plain);
  assert.equal(decrypt(cipher), plain);
});

test('encrypt uses random IV', () => {
  const a = encrypt('same-value');
  const b = encrypt('same-value');

  assert.notEqual(a, b);
  assert.equal(decrypt(a), 'same-value');
  assert.equal(decrypt(b), 'same-value');
});

test('decrypt rejects tampered ciphertext', () => {
  const cipher = encrypt('secret');
  const parts = cipher.split('.');
  parts[2] = parts[2].slice(0, -2) + 'AA';

  assert.throws(() => decrypt(parts.join('.')));
});

test('state sign/verify roundtrip', () => {
  const state = signState({ userId: 'user-1', exp: Date.now() + 60_000 });
  const payload = verifyState(state);

  assert.equal(payload.userId, 'user-1');
});

test('state rejects tampering', () => {
  const state = signState({ userId: 'user-1', exp: Date.now() + 60_000 });
  const tampered = `${state.slice(0, -2)}AA`;

  assert.throws(() => verifyState(tampered));
});

test('state rejects expired payload', () => {
  const state = signState({ userId: 'user-1', exp: Date.now() - 1 });

  assert.throws(() => verifyState(state), /kedaluwarsa/i);
});
