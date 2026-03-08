CREATE TABLE IF NOT EXISTS signals (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state            TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (state IN ('pending','approved','declined')),
  proximity_bucket TEXT        NOT NULL CHECK (proximity_bucket IN ('nearby','same_area')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_signals_pair
  ON signals (sender_id, recipient_id);

CREATE INDEX IF NOT EXISTS idx_signals_recipient_state
  ON signals (recipient_id, state, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signals_sender
  ON signals (sender_id, created_at DESC);
