-- Migration 021: device push token registry for Firebase Cloud Messaging.
-- A user can have multiple devices, so (user_id, token) is the unique key.

CREATE TABLE IF NOT EXISTS fcm_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL,
  platform    TEXT        NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
