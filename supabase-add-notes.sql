-- Add folder column to notes table if it doesn't exist
ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT '';

-- Make title NOT NULL if it isn't already
ALTER TABLE notes ALTER COLUMN title SET NOT NULL;
ALTER TABLE notes ALTER COLUMN title DROP DEFAULT;

-- Create index for folder queries
CREATE INDEX IF NOT EXISTS notes_folder_idx ON notes(folder);

-- Enable full text search on notes title and content
CREATE INDEX IF NOT EXISTS notes_content_search_idx ON notes USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS notes_title_search_idx ON notes USING gin(to_tsvector('english', title));
