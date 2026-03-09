CREATE TABLE IF NOT EXISTS chat_threads (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_threads_canonical CHECK (user_a_id < user_b_id),
  CONSTRAINT chat_threads_pair_unique UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_user_a ON chat_threads (user_a_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_user_b ON chat_threads (user_b_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID        NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body      TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages (thread_id, sent_at ASC);
