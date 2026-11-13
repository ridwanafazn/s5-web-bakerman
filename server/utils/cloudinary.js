const crypto = require('crypto');

const { v2: cloudinary } = require('cloudinary');

const env = require('../config/env');
const { httpError } = require('./httpError');

const configured = Boolean(
  env.cloudinary.cloudName &&
    env.cloudinary.apiKey &&
    env.cloudinary.apiSecret
);

if (configured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

function isConfigured() {
  return configured || env.cloudinary.mock;
}

function isMock() {
  return env.cloudinary.mock;
}

function uploadScreenshot(buffer, { userId }) {
  if (!isConfigured()) {
    throw httpError(
      503,
      'Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }

  if (env.cloudinary.mock) {
    return Promise.resolve({
      publicId: `mock/manual-${userId}-${Date.now()}-${crypto
        .randomBytes(4)
        .toString('hex')}`,
      secureUrl: '',
      bytes: buffer.length,
      mock: true,
    });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinary.folder,
        resource_type: 'image',
        tags: ['manual-activity', `user-${userId}`],
        context: `user=${userId}|source=manual`,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(
            httpError(
              502,
              error?.message || 'Upload screenshot ke Cloudinary gagal',
              'CLOUDINARY_UPLOAD_FAILED'
            )
          );
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          bytes: result.bytes,
          mock: false,
        });
      }
    );

    stream.end(buffer);
  });
}

async function deleteScreenshot(publicId) {
  if (!publicId) return { result: 'ok' };

  if (env.cloudinary.mock) {
    return { result: 'ok' };
  }

  if (!configured) {
    throw httpError(
      503,
      'Cloudinary belum dikonfigurasi.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }

  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });
  } catch (error) {
    throw httpError(
      502,
      error.message || 'Gagal menghapus screenshot dari Cloudinary',
      'CLOUDINARY_DELETE_FAILED'
    );
  }
}

module.exports = {
  isConfigured,
  isMock,
  uploadScreenshot,
  deleteScreenshot,
};
