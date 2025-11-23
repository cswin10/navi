-- Add knowledge_base field to user_profiles
-- Run this in Supabase SQL Editor

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS knowledge_base TEXT DEFAULT '';

-- Update the updated_at timestamp when knowledge_base is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
