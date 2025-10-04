-- Migration script to add AI analysis columns to inspection table
-- Run this script on your PostgreSQL database before starting the backend
-- Note: We use the existing 'state' column for AI analysis status

-- Add AI bounding boxes column (stores JSON as TEXT)
ALTER TABLE inspection 
ADD COLUMN IF NOT EXISTS ai_bounding_boxes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN inspection.ai_bounding_boxes IS 'JSON string containing YOLO model predictions with bounding box coordinates';
COMMENT ON COLUMN inspection.state IS 'Inspection status or AI analysis status. Values: "Pending", "In progress", "Completed" OR "AI Analysis Pending", "AI Analysis Completed", "AI Analysis Failed"';

-- Create index on state column for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_inspection_state 
ON inspection(state);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'inspection' 
AND column_name IN ('ai_bounding_boxes', 'state');
