-- Drop all existing tables
-- Run this FIRST in Supabase SQL Editor, then run your main schema

DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS user_integrations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Done! Now you can run your main schema SQL
