ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
  ADD COLUMN IF NOT EXISTS voice_note_duration_s SMALLINT CHECK (voice_note_duration_s BETWEEN 1 AND 60);

-- Relax body NOT NULL so voice notes can have null body
ALTER TABLE chat_messages
  ALTER COLUMN body DROP NOT NULL;

-- Remove the existing inline body CHECK so we can replace it
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_body_check;

-- Ensure at least one of body or voice_note_url is present
ALTER TABLE chat_messages
  ADD CONSTRAINT messages_content_check
    CHECK (body IS NOT NULL OR voice_note_url IS NOT NULL);
