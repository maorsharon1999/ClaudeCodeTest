'use strict';
/**
 * storageService — abstraction over photo/voice-note upload and deletion.
 *
 * Strategy selection (checked at call time so hot-reload / env changes work):
 *   FIREBASE_STORAGE_BUCKET set → upload to Firebase Storage (GCS), return public URL
 *   Otherwise                  → save to local disk under uploads/, return local URL
 *
 * This keeps Phase 3 additive: existing local-disk behaviour is fully preserved
 * when FIREBASE_STORAGE_BUCKET is not set.
 */

const path = require('path');
const fs   = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// --- Local disk storage (dev / no Firebase) ---

function localFilePath(subdir, filename) {
  return path.join(UPLOAD_DIR, subdir, filename);
}

async function saveToLocal(buffer, filename, subdir) {
  const dir = path.join(UPLOAD_DIR, subdir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(localFilePath(subdir, filename), buffer);
  const baseUrl = process.env.STORAGE_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${subdir}/${filename}`;
}

async function deleteFromLocal(filename, subdir) {
  const fp = localFilePath(subdir, filename);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

// --- Firebase Storage (GCS) ---

async function saveToFirebase(buffer, destPath, contentType) {
  const { getFirebaseAdmin } = require('../db/firebase');
  const admin  = getFirebaseAdmin();
  const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
  const file   = bucket.file(destPath);
  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });
  // Make the file publicly readable
  await file.makePublic();
  return file.publicUrl();
}

async function deleteFromFirebase(destPath) {
  try {
    const { getFirebaseAdmin } = require('../db/firebase');
    const admin  = getFirebaseAdmin();
    const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
    await bucket.file(destPath).delete();
  } catch (err) {
    // Best-effort — file may already be gone
    console.warn('[storageService] Firebase delete error (ignored):', err.message);
  }
}

// --- Public API ---

/**
 * Upload a file buffer.
 * @param {Buffer} buffer        File contents.
 * @param {string} filename      Storage filename (e.g. uuid, no path separator).
 * @param {string} subdir        Local subdir OR Firebase path prefix (e.g. 'photos', 'voice').
 * @param {string} contentType   MIME type (e.g. 'image/jpeg').
 * @returns {Promise<string>}    Publicly accessible URL.
 */
async function uploadFile(buffer, filename, subdir, contentType) {
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    const destPath = `${subdir}/${filename}`;
    return saveToFirebase(buffer, destPath, contentType);
  }
  return saveToLocal(buffer, filename, subdir);
}

/**
 * Delete a previously uploaded file.
 * Pass the same filename + subdir that were used on upload.
 */
async function deleteFile(filename, subdir) {
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    await deleteFromFirebase(`${subdir}/${filename}`);
  } else {
    await deleteFromLocal(filename, subdir);
  }
}

module.exports = { uploadFile, deleteFile };
