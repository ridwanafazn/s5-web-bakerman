const crypto = require('crypto');

// Tanpa karakter ambigu: 0/O, 1/I/L.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateOrderCode(length = 8) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return code;
}

module.exports = { generateOrderCode };
