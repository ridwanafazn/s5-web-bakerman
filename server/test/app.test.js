const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.SKIP_DB_CONNECT = 'true';

const createApp = require('../app');

const app = createApp();

test('GET /health returns ok', async () => {
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.ok(['connected', 'disconnected'].includes(response.body.database));
});

test('GET /ready returns 503 while database is disconnected', async () => {
  const response = await request(app).get('/ready');
  assert.equal(response.status, 503);
  assert.equal(response.body.status, 'not_ready');
});

test('GET /api/v1/me without token returns 401', async () => {
  const response = await request(app).get('/api/v1/me');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'UNAUTHENTICATED');
});

test('GET /api/v1/me with invalid token returns 401', async () => {
  const response = await request(app)
    .get('/api/v1/me')
    .set('Authorization', 'Bearer not-a-real-firebase-token');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'INVALID_TOKEN');
});

test('GET /api/v1/admin/ping without token returns 401', async () => {
  const response = await request(app).get('/api/v1/admin/ping');
  assert.equal(response.status, 401);
});

test('GET /api/v1/products returns 503 while database is disconnected', async () => {
  const response = await request(app).get('/api/v1/products');
  assert.equal(response.status, 503);
  assert.equal(response.body.code, 'DATABASE_UNAVAILABLE');
});
