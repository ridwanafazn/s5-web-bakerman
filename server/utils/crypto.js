const crypto = require('crypto');

const env = require('../config/env');

function getKey() {
  const raw = env.tokenEncryptionKey;
  if (!raw) {
    throw new Error('TOKEN_ENCRYPTION_KEY belum diisi');
  }

  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY harus 64 karakter hex (32 byte)');
  }
  return key;
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

function decrypt(payload) {
  const [ivPart, tagPart, dataPart] = String(payload).split('.');
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Format ciphertext tidak valid');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(ivPart, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function signState(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getKey())
    .update(body)
    .digest('base64url');
  return `${body}.${signature}`;
}

function verifyState(state) {
  const [body, signature] = String(state || '').split('.');
  if (!body || !signature) {
    throw new Error('State tidak valid');
  }

  const expected = crypto
    .createHmac('sha256', getKey())
    .update(body)
    .digest('base64url');

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Signature state tidak valid');
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error('State kedaluwarsa');
  }

  return payload;
}

module.exports = { encrypt, decrypt, signState, verifyState };
