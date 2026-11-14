const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseServiceAccount(raw) {
  if (!raw) return null;

  const value = raw.trim();
  if (value.startsWith('{')) {
    return JSON.parse(value);
  }

  const filePath = path.isAbsolute(value) ? value : path.join(__dirname, '..', value);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  throw new Error('FIREBASE_SERVICE_ACCOUNT must be JSON or a valid file path');
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const corsOrigins = splitList(process.env.CORS_ORIGIN || 'http://localhost:5173');
const tokenEncryptionKey = process.env.TOKEN_ENCRYPTION_KEY || '';
const trustProxyRaw = process.env.TRUST_PROXY;
const trustProxy =
  trustProxyRaw === 'false' ? 0 : Number(trustProxyRaw || 1);
const logRequests = process.env.LOG_REQUESTS === 'true' || isProduction;
const manualActivityRetentionDays = Number(
  process.env.MANUAL_ACTIVITY_SCREENSHOT_DAYS || 7
);
const manualActivityMaxScreenshotMb = Number(
  process.env.MANUAL_ACTIVITY_MAX_MB || 5
);

const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5050),
  mongoUri:
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/bakerman?directConnection=true',
  corsOrigins,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'bakerman-mern',
  firebaseServiceAccount: parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT),
  adminEmails: splitList(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase()),
  staffEmails: splitList(process.env.STAFF_EMAILS).map((email) => email.toLowerCase()),
  timezone: process.env.APP_TIMEZONE || 'Asia/Jakarta',
  dnsServers: splitList(process.env.DNS_SERVERS),
  tokenEncryptionKey,
  trustProxy: Number.isInteger(trustProxy) && trustProxy >= 0 ? trustProxy : 1,
  logRequests,
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID || '',
    clientSecret: process.env.STRAVA_CLIENT_SECRET || '',
    redirectUri:
      process.env.STRAVA_REDIRECT_URI ||
      'http://localhost:5050/api/v1/strava/callback',
    demoMode: process.env.STRAVA_DEMO_MODE === 'true' && !isProduction,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder:
      process.env.CLOUDINARY_FOLDER || 'bakerman/manual-activities',
    mock: process.env.CLOUDINARY_MOCK === 'true' && !isProduction,
  },
  manualActivity: {
    screenshotRetentionDays:
      Number.isInteger(manualActivityRetentionDays) &&
      manualActivityRetentionDays >= 1 &&
      manualActivityRetentionDays <= 30
        ? manualActivityRetentionDays
        : 7,
    maxScreenshotMb:
      Number.isInteger(manualActivityMaxScreenshotMb) &&
      manualActivityMaxScreenshotMb >= 1 &&
      manualActivityMaxScreenshotMb <= 10
        ? manualActivityMaxScreenshotMb
        : 5,
  },
  cronSecret: process.env.CRON_SECRET || '',
};

if (!env.mongoUri) {
  throw new Error('MONGODB_URI is required');
}

if (!env.firebaseProjectId) {
  throw new Error('FIREBASE_PROJECT_ID is required');
}

if (env.isProduction) {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI wajib diisi eksplisit di production.');
  }

  if (!process.env.CORS_ORIGIN) {
    throw new Error('CORS_ORIGIN wajib diisi eksplisit di production.');
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID wajib diisi eksplisit di production.');
  }

  if (!/^[0-9a-fA-F]{64}$/.test(env.tokenEncryptionKey)) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY wajib 64 karakter hex di production. Generate dengan: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  if (env.corsOrigins.length === 0 || env.corsOrigins.includes('*')) {
    throw new Error(
      'CORS_ORIGIN wajib berisi origin eksplisit di production (jangan gunakan *).'
    );
  }

  if (!env.cloudinary.cloudName) {
    console.warn(
      '[env] Cloudinary belum dikonfigurasi; upload bukti aktivitas manual akan ditolak (503).'
    );
  }
}

module.exports = env;
