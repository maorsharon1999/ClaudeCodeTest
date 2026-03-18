'use strict';
/**
 * storageService — upload and deletion via Firebase Storage (GCS).
 * Auth is exclusively handled via Firebase; no local-disk fallback.
 */

const config = require('../config');

// Signed URL expiry: 7 days from now, in milliseconds.
const SIGNED_URL_EXPIRY_MS = () => Date.now() + 7 * 24 * 60 * 60 * 1000;

// --- Firebase Storage (GCS) ---

async function saveToFirebase(buffer, destPath, contentType) {
  const { getFirebaseAdmin } = require('../db/firebase');
  const admin  = getFirebaseAdmin();
  const bucket = admin.storage().bucket(config.firebaseStorageBucket);
  const file   = bucket.file(destPath);
  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: SIGNED_URL_EXPIRY_MS(),
  });
  return signedUrl;
}

/**
 * Generate a fresh signed URL for an already-stored file path.
 * @param {string} filePath  Full storage path (e.g. 'photos/uuid.jpg').
 * @returns {Promise<string>} Signed URL valid for 7 days.
 */
async function getSignedUrl(filePath) {
  const { getFirebaseAdmin } = require('../db/firebase');
  const admin  = getFirebaseAdmin();
  const bucket = admin.storage().bucket(config.firebaseStorageBucket);
  const file   = bucket.file(filePath);
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: SIGNED_URL_EXPIRY_MS(),
  });
  return signedUrl;
}

async function deleteFromFirebase(destPath) {
  try {
    const { getFirebaseAdmin } = require('../db/firebase');
    const admin  = getFirebaseAdmin();
    const bucket = admin.storage().bucket(config.firebaseStorageBucket);
    await bucket.file(destPath).delete();
  } catch (err) {
    // Best-effort — file may already be gone
    console.warn('[storageService] Firebase delete error (ignored):', err.message);
  }
}

// --- Public API ---

/**
 * Upload a file buffer to Firebase Storage.
 * @param {Buffer} buffer        File contents.
 * @param {string} filename      Storage filename (e.g. uuid, no path separator).
 * @param {string} subdir        Firebase path prefix (e.g. 'photos', 'voice').
 * @param {string} contentType   MIME type (e.g. 'image/jpeg').
 * @returns {Promise<string>}    Signed URL valid for 7 days.
 */
async function uploadFile(buffer, filename, subdir, contentType) {
  const destPath = `${subdir}/${filename}`;
  return saveToFirebase(buffer, destPath, contentType);
}

/**
 * Delete a previously uploaded file from Firebase Storage.
 * Pass the same filename + subdir that were used on upload.
 */
async function deleteFile(filename, subdir) {
  await deleteFromFirebase(`${subdir}/${filename}`);
}

module.exports = { uploadFile, deleteFile, getSignedUrl };
