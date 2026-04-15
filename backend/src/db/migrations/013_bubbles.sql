-- Bubble pivot: core entities

CREATE TABLE IF NOT EXISTS bubbles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  radius_m      INT NOT NULL DEFAULT 200,
  duration_h    INT NOT NULL DEFAULT 4,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at    TIMESTAMPTZ,

  CONSTRAINT bubbles_title_len CHECK (char_length(title) BETWEEN 1 AND 60),
  CONSTRAINT bubbles_desc_len CHECK (description IS NULL OR char_length(description) <= 300),
  CONSTRAINT bubbles_duration CHECK (duration_h BETWEEN 1 AND 8)
);

CREATE INDEX IF NOT EXISTS idx_bubbles_location ON bubbles (lat, lng);
CREATE INDEX IF NOT EXISTS idx_bubbles_expires_at ON bubbles (expires_at);
CREATE INDEX IF NOT EXISTS idx_bubbles_creator ON bubbles (creator_id);

CREATE TABLE IF NOT EXISTS bubble_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bubble_id  UUID NOT NULL REFERENCES bubbles(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at    TIMESTAMPTZ,

  CONSTRAINT bubble_members_unique UNIQUE (bubble_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bubble_members_bubble ON bubble_members (bubble_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bubble_members_user ON bubble_members (user_id) WHERE left_at IS NULL;

CREATE TABLE IF NOT EXISTS bubble_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bubble_id  UUID NOT NULL REFERENCES bubbles(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT bubble_msg_body_len CHECK (char_length(body) BETWEEN 1 AND 1000)
);

CREATE INDEX IF NOT EXISTS idx_bubble_messages_thread ON bubble_messages (bubble_id, sent_at ASC);
