ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS intent TEXT
    CHECK (intent IN ('casual', 'serious', 'open'));
