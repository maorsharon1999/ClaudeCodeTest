'use strict';
/**
 * Firebase Admin SDK initializer.
 *
 * Lazy-initializes the Firebase Admin app on first call to getFirebaseAdmin().
 * If Firebase env vars are not set the module throws a clear error at call time,
 * so the existing backend still boots normally without them.
 */

let _app = null;

function getFirebaseAdmin() {
  if (_app) return _app;

  const admin = require('firebase-admin');

  if (admin.apps.length > 0) {
    _app = admin.apps[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID env var is required for Firebase Auth verification.');
  }

  let credential;
  if (serviceAccountEnv) {
    // Accept either a JSON string or a file path
    let serviceAccount;
    if (serviceAccountEnv.trim().startsWith('{')) {
      serviceAccount = JSON.parse(serviceAccountEnv);
    } else {
      serviceAccount = require(serviceAccountEnv);
    }
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Fall back to Application Default Credentials (works on Cloud Run / GCE)
    credential = admin.credential.applicationDefault();
  }

  _app = admin.initializeApp({ credential, projectId });
  return _app;
}

module.exports = { getFirebaseAdmin };
