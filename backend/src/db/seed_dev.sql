-- Dev seed: insert a fixed dev user for auth-frozen mode.
-- Run once: psql $DATABASE_URL -f src/db/seed_dev.sql

INSERT INTO users (id, phone_hash)
VALUES ('00000000-0000-0000-0000-000000000001', 'dev-phone-hash')
ON CONFLICT (id) DO NOTHING;
