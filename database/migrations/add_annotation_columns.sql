-- Migration: Add user annotation columns to inspection table
-- Stores user edits/additions and deletions of bounding boxes as JSON strings

ALTER TABLE inspection 
ADD COLUMN IF NOT EXISTS edited_or_manually_added_boxes TEXT;

ALTER TABLE inspection 
ADD COLUMN IF NOT EXISTS deleted_bounding_boxes TEXT;

COMMENT ON COLUMN inspection.edited_or_manually_added_boxes IS 'JSON containing user-added or edited bounding boxes with metadata (type, comment, timestamp, userId)';
COMMENT ON COLUMN inspection.deleted_bounding_boxes IS 'JSON containing user-deleted bounding boxes with metadata (type, comment, timestamp, userId)';

-- Verification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'inspection' 
AND column_name IN ('edited_or_manually_added_boxes', 'deleted_bounding_boxes');
