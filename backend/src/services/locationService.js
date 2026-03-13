'use strict';
const pool = require('../db/pool');

// djb2 string hash — returns a 32-bit signed integer
function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash |= 0; // keep 32-bit signed
  }
  return hash;
}

// LCG step: next = (a * seed + c) mod m (32-bit signed arithmetic)
function lcgStep(seed) {
  return (Math.imul(1664525, seed) + 1013904223) | 0;
}

// Returns a stable, privacy-safe jittered coordinate pair for a user.
// The jitter is deterministic per (userId, 5-min time bucket) so the
// position drifts slowly rather than jumping every render, but exact
// coordinates are never exposed.
function jitterCoords(userId, lat, lng, bucket, recordedAt) {
  const timeBucket = Math.floor(new Date(recordedAt).getTime() / 300000);
  const seed = djb2(userId + String(timeBucket));

  const step1 = lcgStep(seed);
  const step2 = lcgStep(step1);

  // Normalise LCG outputs to [-1, 1]
  const r1 = step1 / 2147483647;
  const r2 = step2 / 2147483647;

  const maxM = bucket === 'nearby' ? 100 : 300;

  const dLat = (r1 * maxM) / 111000;
  const dLng = (r2 * maxM) / (111000 * Math.cos((lat * Math.PI) / 180));

  return {
    jittered_lat: lat + dLat,
    jittered_lng: lng + dLng,
  };
}

async function upsertLocation(userId, lat, lng) {
  if (lat == null || lng == null) {
    const err = new Error('lat and lng are required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    const err = new Error('lat must be in [-90,90] and lng in [-180,180]');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  await pool.query(
    `INSERT INTO user_locations (user_id, lat, lng, recorded_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, recorded_at = NOW()`,
    [userId, lat, lng]
  );
}

async function getNearby(userId) {
  // Query 1: get caller's own fresh location (TTL 30 min)
  const locResult = await pool.query(
    `SELECT lat, lng FROM user_locations
     WHERE user_id = $1 AND recorded_at > NOW() - INTERVAL '30 minutes'`,
    [userId]
  );
  if (locResult.rows.length === 0) return [];

  const { lat: callerLat, lng: callerLng } = locResult.rows[0];

  // Query 2: get caller's gender and looking_for
  const profileResult = await pool.query(
    `SELECT gender, looking_for FROM profiles WHERE user_id = $1`,
    [userId]
  );
  const callerProfile = profileResult.rows[0] || {};
  const callerGender     = callerProfile.gender      || null;
  const callerLookingFor = callerProfile.looking_for || null;

  // Main CTE query
  // Bilateral compatibility is enforced both as a hard WHERE filter and as a score bonus:
  //   - Hard filter: caller's looking_for must include candidate's gender (or be 'everyone')
  //   - Hard filter: candidate's looking_for must include caller's gender (or be 'everyone')
  //   - Score +2: both preferences are non-null and mutually satisfied
  // $1=userId, $2=callerLat, $3=callerLng, $4=callerGender, $5=callerLookingFor
  const result = await pool.query(
    `WITH candidates AS (
      SELECT
        p.user_id,
        p.display_name,
        date_part('year', age(p.birth_date))::int AS age,
        p.bio,
        p.photos,
        p.gender,
        p.looking_for AS candidate_looking_for,
        vs.updated_at AS visibility_updated_at,
        ul.lat,
        ul.lng,
        ul.recorded_at,
        6371000 * acos(LEAST(1.0,
          cos(radians($2)) * cos(radians(ul.lat))
            * cos(radians(ul.lng) - radians($3))
          + sin(radians($2)) * sin(radians(ul.lat))
        )) AS dist_m
      FROM profiles p
      JOIN visibility_states vs ON vs.user_id = p.user_id
      JOIN user_locations ul ON ul.user_id = p.user_id
      WHERE p.user_id != $1
        AND vs.state = 'visible'
        AND ul.recorded_at > NOW() - INTERVAL '30 minutes'
        -- Bilateral hard filters (skipped when caller has no profile data)
        AND ($5::text IS NULL OR $5::text = 'everyone' OR p.gender = $5::text)
        AND ($4::text IS NULL OR p.looking_for = 'everyone' OR p.looking_for = $4::text)
    ),
    bucketed AS (
      SELECT
        user_id,
        display_name,
        age,
        bio,
        photos,
        gender,
        candidate_looking_for,
        visibility_updated_at,
        lat,
        lng,
        recorded_at,
        CASE
          WHEN dist_m < 500  THEN 'nearby'
          WHEN dist_m < 2000 THEN 'same_area'
        END AS proximity_bucket
      FROM candidates
      WHERE dist_m < 2000
    ),
    scored AS (
      SELECT
        user_id,
        display_name,
        age,
        bio,
        photos,
        proximity_bucket,
        lat,
        lng,
        recorded_at,
        (
          CASE proximity_bucket WHEN 'nearby' THEN 5 WHEN 'same_area' THEN 2 ELSE 0 END
          + CASE
              WHEN visibility_updated_at > NOW() - INTERVAL '5 minutes'  THEN 2
              WHEN visibility_updated_at > NOW() - INTERVAL '30 minutes' THEN 1
              ELSE 0
            END
          + CASE
              WHEN $4::text IS NULL OR $5::text IS NULL THEN 0
              WHEN ($5::text = 'everyone' OR gender = $5::text)
               AND (candidate_looking_for = 'everyone' OR candidate_looking_for = $4::text) THEN 2
              ELSE 0
            END
        ) AS score
      FROM bucketed
    )
    SELECT user_id, display_name, age, bio, photos, proximity_bucket, lat, lng, recorded_at, score
    FROM scored
    ORDER BY score DESC, user_id ASC
    LIMIT 20`,
    [userId, callerLat, callerLng, callerGender ?? null, callerLookingFor ?? null]
  );

  // Strip raw coords and score; apply deterministic jitter before returning
  return result.rows
    .slice(0, 20)
    .map(({ score: _s, lat: _lat, lng: _lng, recorded_at: _ra, ...rest }) => ({
      ...rest,
      ...jitterCoords(rest.user_id, _lat, _lng, rest.proximity_bucket, _ra),
    }));
}

module.exports = { upsertLocation, getNearby, jitterCoords, djb2 };
