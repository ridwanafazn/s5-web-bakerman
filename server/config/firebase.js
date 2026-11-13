const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const env = require('./env');

function initFirebase() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const options = { projectId: env.firebaseProjectId };
  if (env.firebaseServiceAccount) {
    options.credential = cert(env.firebaseServiceAccount);
  }

  return initializeApp(options);
}

async function verifyIdToken(token) {
  initFirebase();
  return getAuth().verifyIdToken(token);
}

module.exports = { initFirebase, verifyIdToken };
