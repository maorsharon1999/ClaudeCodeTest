-- Migration 019: tighten spatial_messages CHECK to remove 'circles' visibility_type.
--
-- Pre-flight required before running against production (Neon):
--   SELECT COUNT(*) FROM spatial_messages WHERE visibility_type = 'circles';
-- If count > 0, UPDATE or DELETE those rows before applying.
--
-- Drops the existing CHECK constraint and re-adds it with only ('public', 'specific').

ALTER TABLE spatial_messages
  DROP CONSTRAINT IF EXISTS spatial_messages_visibility_type_check;

ALTER TABLE spatial_messages
  ADD CONSTRAINT spatial_messages_visibility_type_check
    CHECK (visibility_type IN ('public', 'specific'));
