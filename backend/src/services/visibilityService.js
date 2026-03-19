'use strict';
const pool = require('../db/pool');

const VALID_STATES = ['invisible', 'visible'];

async function getVisibility(userId) {
  const { rows } = await pool.query(
    `SELECT state, updated_at FROM visibility_states WHERE user_id = $1`,
    [userId]
  );
  // Row is guaranteed to exist (created on Firebase auth signup), but guard anyway
  return rows[0] || { state: 'invisible', updated_at: new Date() };
}

async function setVisibility(userId, state) {
  if (!VALID_STATES.includes(state)) {
    const e = new Error(`state must be one of: ${VALID_STATES.join(', ')}.`);
    e.status = 400; e.code = 'VALIDATION_ERROR'; throw e;
  }

  const { rows } = await pool.query(
    `INSERT INTO visibility_states (user_id, state, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET state = EXCLUDED.state, updated_at = NOW()
     RETURNING state, updated_at`,
    [userId, state]
  );
  return rows[0];
}

module.exports = { getVisibility, setVisibility };
