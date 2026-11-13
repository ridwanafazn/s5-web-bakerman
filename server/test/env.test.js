const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const serverRoot = path.join(__dirname, '..');
const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function loadEnvWith(overrides) {
  return spawnSync(process.execPath, ['-e', "require('./config/env')"], {
    cwd: serverRoot,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      FIREBASE_PROJECT_ID: 'bakerman-test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/bakerman-test',
      TOKEN_ENCRYPTION_KEY: validKey,
      CORS_ORIGIN: 'https://example.com',
      ...overrides,
    },
    encoding: 'utf8',
  });
}

test('production env rejects weak TOKEN_ENCRYPTION_KEY', () => {
  const result = loadEnvWith({ TOKEN_ENCRYPTION_KEY: 'short' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TOKEN_ENCRYPTION_KEY/);
});

test('production env rejects wildcard CORS_ORIGIN', () => {
  const result = loadEnvWith({ CORS_ORIGIN: '*' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CORS_ORIGIN/);
});

test('production env accepts explicit origin and valid key', () => {
  const result = loadEnvWith({});
  assert.equal(result.status, 0);
});
