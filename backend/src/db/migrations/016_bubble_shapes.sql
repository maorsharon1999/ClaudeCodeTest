-- Add shape support to bubbles (circle, polygon, rectangle)

ALTER TABLE bubbles
  ADD COLUMN IF NOT EXISTS shape_type TEXT NOT NULL DEFAULT 'circle'
    CHECK (shape_type IN ('circle', 'polygon', 'rectangle')),
  ADD COLUMN IF NOT EXISTS shape_coords JSONB;
