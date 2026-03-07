-- Bubble MVP: Slice 1 initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash  TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  birth_date   DATE NOT NULL,
  bio          TEXT CHECK (char_length(bio) <= 140),
  gender       TEXT CHECK (gender IN ('man','woman','nonbinary','other')),
  looking_for  TEXT CHECK (looking_for IN ('men','women','everyone','nonbinary')),
  photos       TEXT[] CHECK (array_length(photos, 1) <= 3),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visibility_states (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state      TEXT NOT NULL DEFAULT 'invisible' CHECK (state IN ('invisible','visible')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash    TEXT NOT NULL,
  code_hash     TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_attempts_phone_hash ON otp_attempts(phone_hash);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_expires_at ON otp_attempts(expires_at);
