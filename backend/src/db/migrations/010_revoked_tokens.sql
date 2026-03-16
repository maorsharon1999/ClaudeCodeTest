-- Phase 2: Replace Redis refresh-token revocation with a Postgres table.
-- Also replaces the Redis OTP phone-lock — otp_attempts.attempt_count already
-- carries this state, so no extra column is needed.

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        TEXT        PRIMARY KEY,
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
