-- Migration 011: email + password authentication
-- Adds email and password_hash columns to users.
-- phone_hash becomes nullable so email-only users can register without a phone.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ALTER COLUMN phone_hash DROP NOT NULL;
