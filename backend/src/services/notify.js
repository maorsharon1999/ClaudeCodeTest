'use strict';
const { getFirebaseAdmin } = require('../db/firebase');
const pool = require('../db/pool');

async function sendToUser(userId, { title, body, data = {} }) {
  const result = await pool.query(
    'SELECT token FROM fcm_tokens WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) return;

  const admin = getFirebaseAdmin();
  const tokens = result.rows.map(r => r.token);
  const staleTokens = [];

  for (const token of tokens) {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        android: {
          priority: 'high',
          notification: { channelId: 'bubble-default' },
        },
      });
    } catch (err) {
      if (
        err.code === 'messaging/invalid-registration-token' ||
        err.code === 'messaging/registration-token-not-registered'
      ) {
        staleTokens.push(token);
      } else {
        console.error(`Push send failed for user ${userId}:`, err.message);
      }
    }
  }

  if (staleTokens.length > 0) {
    await pool.query(
      'DELETE FROM fcm_tokens WHERE user_id = $1 AND token = ANY($2)',
      [userId, staleTokens]
    );
  }
}

async function sendToUsers(userIds, { title, body, data = {} }, excludeUserId = null) {
  const targets = excludeUserId
    ? userIds.filter(id => id !== excludeUserId)
    : userIds;
  await Promise.allSettled(
    targets.map(uid => sendToUser(uid, { title, body, data }))
  );
}

module.exports = { sendToUser, sendToUsers };
