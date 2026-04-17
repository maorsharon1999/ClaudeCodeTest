-- Migration 020: drop otp_attempts table.
--
-- otp_attempts was created in migration 001 for a phone-OTP flow that was
-- never implemented. Firebase Auth handles phone OTP natively if needed later.
-- Zero references in backend/src/ runtime code; only historical mentions in
-- migrations 001, 010, and 012.

DROP TABLE IF EXISTS otp_attempts;
