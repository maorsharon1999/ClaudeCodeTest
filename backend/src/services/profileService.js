'use strict';
const pool = require('../db/pool');

const VALID_GENDERS      = ['man', 'woman', 'nonbinary', 'other'];
const VALID_LOOKING_FOR  = ['men', 'women', 'everyone', 'nonbinary'];
const VALID_INTENTS      = ['casual', 'serious', 'open'];
const VALID_INTERESTS    = ['Social', 'Study', 'Food & Drinks', 'Sports', 'Music', 'Nightlife', 'Outdoors', 'Gaming', 'Tech', 'Art'];
const MAX_PHOTOS         = 3;

// Matches legacy localhost/127.0.0.1 upload URLs that were served by express.static
// before the Firebase Storage migration.
const LEGACY_UPLOAD_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\//i;

/**
 * Returns true if the URL is a valid Firebase/Google Cloud Storage URL that
 * must pass through unchanged.
 */
function isFirebaseStorageUrl(url) {
  return typeof url === 'string' && (
    url.startsWith('https://firebasestorage.googleapis.com/') ||
    url.startsWith('https://storage.googleapis.com/')
  );
}

/**
 * Returns true if the URL is a legacy localhost upload URL that should be stripped.
 */
function isLegacyUploadUrl(url) {
  return typeof url === 'string' && LEGACY_UPLOAD_PATTERN.test(url);
}

/**
 * Sanitizes the photos array on a profile row in-place (does not mutate the DB).
 * Legacy localhost URLs are replaced with null; Firebase URLs pass through unchanged.
 * Returns a new profile object — the original row is not mutated.
 */
function stripLegacyPhotoUrls(profile) {
  if (!profile) return profile;
  const photos = Array.isArray(profile.photos) ? profile.photos : [];
  const sanitized = photos.map(url => (isLegacyUploadUrl(url) ? null : url));
  return { ...profile, photos: sanitized };
}

function ageFromBirthDate(birthDate) {
  const birth = new Date(birthDate);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

async function getProfile(userId) {
  const { rows } = await pool.query(
    `SELECT user_id, display_name, birth_date, bio, gender, looking_for, intent, interests, photos, updated_at
     FROM profiles WHERE user_id = $1`,
    [userId]
  );
  return stripLegacyPhotoUrls(rows[0] || null);
}

async function upsertProfile(userId, body) {
  const { display_name, birth_date, bio, gender, looking_for, intent, interests } = body;

  // Validate required fields
  if (!display_name || typeof display_name !== 'string' || !display_name.trim()) {
    const e = new Error('display_name is required.');
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }
  if (display_name.trim().length > 40) {
    const e = new Error('display_name must be 40 characters or fewer.');
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }
  // birth_date is optional; validate only when provided
  if (birth_date) {
    const parsedDate = new Date(birth_date);
    if (isNaN(parsedDate.getTime())) {
      const e = new Error('birth_date must be a valid date (YYYY-MM-DD).');
      e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }
    if (ageFromBirthDate(birth_date) < 18) {
      const e = new Error('You must be at least 18 years old.');
      e.status = 400; e.code = 'AGE_REQUIREMENT'; throw e;
    }
  }
  if (bio && bio.length > 140) {
    const e = new Error('bio must be 140 characters or fewer.');
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }
  if (gender && !VALID_GENDERS.includes(gender)) {
    const e = new Error(`gender must be one of: ${VALID_GENDERS.join(', ')}.`);
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }
  if (looking_for && !VALID_LOOKING_FOR.includes(looking_for)) {
    const e = new Error(`looking_for must be one of: ${VALID_LOOKING_FOR.join(', ')}.`);
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }
  if (intent && !VALID_INTENTS.includes(intent)) {
    const e = new Error(`intent must be one of: ${VALID_INTENTS.join(', ')}.`);
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }
  if (interests !== undefined && interests !== null) {
    if (!Array.isArray(interests)) {
      const e = new Error('interests must be an array.');
      e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }
    if (interests.length > 10) {
      const e = new Error('interests must contain 10 or fewer items.');
      e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }
    const invalid = interests.filter(i => !VALID_INTERESTS.includes(i));
    if (invalid.length > 0) {
      const e = new Error(`Invalid interests: ${invalid.join(', ')}. Must be from: ${VALID_INTERESTS.join(', ')}.`);
      e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }
  }

  const interestsValue = Array.isArray(interests) ? interests : null;

  const { rows } = await pool.query(
    `INSERT INTO profiles (user_id, display_name, birth_date, bio, gender, looking_for, intent, interests, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           birth_date   = EXCLUDED.birth_date,
           bio          = EXCLUDED.bio,
           gender       = EXCLUDED.gender,
           looking_for  = EXCLUDED.looking_for,
           intent       = EXCLUDED.intent,
           interests    = COALESCE(EXCLUDED.interests, profiles.interests),
           updated_at   = NOW()
     RETURNING user_id, display_name, birth_date, bio, gender, looking_for, intent, interests, photos, updated_at`,
    [userId, display_name.trim(), birth_date || null, bio || null, gender || null, looking_for || null, intent || null, interestsValue]
  );

  return rows[0];
}

async function addPhoto(userId, url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    const e = new Error('A valid photo URL is required.');
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }

  // Lock row and check current count
  const { rows } = await pool.query(
    `SELECT photos FROM profiles WHERE user_id = $1 FOR UPDATE`,
    [userId]
  );
  if (rows.length === 0) {
    const e = new Error('Profile not found. Create a profile before adding photos.');
    e.status = 404; e.code = 'PROFILE_NOT_FOUND'; throw e;
  }

  const current = rows[0].photos || [];
  if (current.length >= MAX_PHOTOS) {
    const e = new Error(`Maximum ${MAX_PHOTOS} photos allowed.`);
    e.status = 400; e.code = 'PHOTOS_LIMIT'; throw e;
  }

  const updated = [...current, url];
  const result = await pool.query(
    `UPDATE profiles SET photos = $1, updated_at = NOW() WHERE user_id = $2
     RETURNING photos`,
    [updated, userId]
  );
  return result.rows[0].photos;
}

async function removePhoto(userId, index) {
  const idx = parseInt(index, 10);
  if (isNaN(idx) || idx < 0) {
    const e = new Error('Index must be a non-negative integer.');
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }

  const { rows } = await pool.query(
    `SELECT photos FROM profiles WHERE user_id = $1 FOR UPDATE`,
    [userId]
  );
  if (rows.length === 0) {
    const e = new Error('Profile not found.');
    e.status = 404; e.code = 'PROFILE_NOT_FOUND'; throw e;
  }

  const current = rows[0].photos || [];
  if (idx >= current.length) {
    const e = new Error(`No photo at index ${idx}.`);
    e.status = 404; e.code = 'PHOTO_NOT_FOUND'; throw e;
  }

  const updated = current.filter((_, i) => i !== idx);
  const result = await pool.query(
    `UPDATE profiles SET photos = $1, updated_at = NOW() WHERE user_id = $2
     RETURNING photos`,
    [updated, userId]
  );
  return result.rows[0].photos;
}

/**
 * One-time migration: finds all profile rows that contain at least one legacy
 * localhost upload URL and sets those specific entries to null.
 * Firebase Storage URLs within the same photos array are preserved.
 * Returns the number of rows updated.
 */
async function stripLegacyPhotoUrlsFromAllProfiles() {
  // Fetch only rows that have at least one non-null photo entry so we avoid
  // loading every profile in the system.
  const { rows } = await pool.query(
    `SELECT user_id, photos FROM profiles WHERE photos IS NOT NULL AND array_length(photos, 1) > 0`
  );

  let updatedCount = 0;

  for (const row of rows) {
    const original = row.photos || [];
    const sanitized = original.map(url => (isLegacyUploadUrl(url) ? null : url));

    // Only write back if something actually changed
    const changed = original.some((url, i) => url !== sanitized[i]);
    if (!changed) continue;

    await pool.query(
      `UPDATE profiles SET photos = $1, updated_at = NOW() WHERE user_id = $2`,
      [sanitized, row.user_id]
    );
    updatedCount++;
  }

  return updatedCount;
}

module.exports = { getProfile, upsertProfile, addPhoto, removePhoto, stripLegacyPhotoUrlsFromAllProfiles };
