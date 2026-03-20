-- Make dating-specific fields nullable (they already allow NULL in the CHECK constraints)
-- birth_date was NOT NULL - make it optional for the social discovery pivot
ALTER TABLE profiles ALTER COLUMN birth_date DROP NOT NULL;

-- Add reported_bubble_id to reports table for bubble reporting
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_bubble_id UUID REFERENCES bubbles(id) ON DELETE CASCADE;
