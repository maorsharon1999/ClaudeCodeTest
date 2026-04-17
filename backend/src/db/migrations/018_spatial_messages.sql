CREATE TABLE IF NOT EXISTS spatial_messages (
  id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT             NOT NULL CHECK (char_length(content) BETWEEN 1 AND 280),
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  visibility_type TEXT             NOT NULL DEFAULT 'public'
                                   CHECK (visibility_type IN ('public', 'circles', 'specific')),
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spatial_messages_location ON spatial_messages (lat, lng);
CREATE INDEX IF NOT EXISTS idx_spatial_messages_user     ON spatial_messages (user_id);

CREATE TABLE IF NOT EXISTS spatial_message_targets (
  message_id     UUID NOT NULL REFERENCES spatial_messages(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, target_user_id)
);
