-- Phase 1: Firebase Auth integration
-- Add firebase_uid column to users for Firebase identity linking.
-- phone_hash remains as the existing identity; firebase_uid is additive for now.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
