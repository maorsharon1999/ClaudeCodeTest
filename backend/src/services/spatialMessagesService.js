'use strict';
const pool = require('../db/pool');

async function createSpatialMessage(userId, { content, lat, lng, visibility_type, target_user_ids }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO spatial_messages (user_id, content, lat, lng, visibility_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, lat, lng, visibility_type, created_at`,
      [userId, content, lat, lng, visibility_type || 'public']
    );
    const msg = result.rows[0];

    if (visibility_type === 'specific' && Array.isArray(target_user_ids) && target_user_ids.length > 0) {
      for (const targetId of target_user_ids) {
        await client.query(
          `INSERT INTO spatial_message_targets (message_id, target_user_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [msg.id, targetId]
        );
      }
    }

    await client.query('COMMIT');
    return msg;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getNearbyMessages(userId, lat, lng, radiusMeters = 500) {
  const result = await pool.query(
    `SELECT
       sm.id,
       sm.lat,
       sm.lng,
       sm.visibility_type,
       sm.created_at,
       u.display_name AS author_name,
       6371000 * acos(LEAST(1.0,
         cos(radians($2)) * cos(radians(sm.lat))
           * cos(radians(sm.lng) - radians($3))
         + sin(radians($2)) * sin(radians(sm.lat))
       )) AS dist_m,
       CASE
         WHEN 6371000 * acos(LEAST(1.0,
           cos(radians($2)) * cos(radians(sm.lat))
             * cos(radians(sm.lng) - radians($3))
           + sin(radians($2)) * sin(radians(sm.lat))
         )) < 50 THEN sm.content
         ELSE NULL
       END AS content
     FROM spatial_messages sm
     JOIN users u ON u.id = sm.user_id
     WHERE
       6371000 * acos(LEAST(1.0,
         cos(radians($2)) * cos(radians(sm.lat))
           * cos(radians(sm.lng) - radians($3))
         + sin(radians($2)) * sin(radians(sm.lat))
       )) <= $4
       AND (
         sm.user_id = $1
         OR sm.visibility_type = 'public'
         OR (
           sm.visibility_type = 'specific' AND EXISTS (
             SELECT 1 FROM spatial_message_targets t
             WHERE t.message_id = sm.id AND t.target_user_id = $1
           )
         )
       )
     ORDER BY dist_m ASC`,
    [userId, lat, lng, radiusMeters]
  );

  return result.rows.map(row => ({
    ...row,
    dist_m: parseFloat(row.dist_m),
    is_unlocked: parseFloat(row.dist_m) < 50,
  }));
}

module.exports = { createSpatialMessage, getNearbyMessages };
