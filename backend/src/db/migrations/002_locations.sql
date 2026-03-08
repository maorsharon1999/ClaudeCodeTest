CREATE TABLE IF NOT EXISTS user_locations (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_locations_recorded_at
  ON user_locations (recorded_at);
