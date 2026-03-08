'use strict';
const pool = require('../db/pool');

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
  const callerGender = callerProfile.gender || null;
  const callerLookingFor = callerProfile.looking_for || null;

  // Main CTE query
  const result = await pool.query(
    `WITH candidates AS (
      SELECT
        p.user_id,
        p.display_name,
        date_part('year', age(p.birth_date))::int AS age,
        p.bio,
        p.photos,
        p.gender,
        vs.updated_at AS visibility_updated_at,
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
    ),
    bucketed AS (
      SELECT
        user_id,
        display_name,
        age,
        bio,
        photos,
        gender,
        visibility_updated_at,
        dist_m,
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
        (
          CASE proximity_bucket WHEN 'nearby' THEN 5 WHEN 'same_area' THEN 2 ELSE 0 END
          + CASE
              WHEN visibility_updated_at > NOW() - INTERVAL '5 minutes'  THEN 2
              WHEN visibility_updated_at > NOW() - INTERVAL '30 minutes' THEN 1
              ELSE 0
            END
          + CASE
              WHEN $4 IS NULL OR $5 IS NULL THEN 0
              WHEN $5 = 'everyone' OR gender = $4 THEN 2
              WHEN gender = 'everyone' THEN 2
              ELSE 0
            END
        ) AS score
      FROM bucketed
    )
    SELECT user_id, display_name, age, bio, photos, proximity_bucket, score
    FROM scored
    ORDER BY score DESC, user_id ASC
    LIMIT 20`,
    [userId, callerLat, callerLng, callerGender, callerLookingFor]
  );

  // Strip score before returning
  return result.rows.map(({ score: _score, ...rest }) => rest);
}

module.exports = { upsertLocation, getNearby };
