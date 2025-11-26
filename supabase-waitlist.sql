-- Waitlist table for early access signups
-- Run this in Supabase SQL Editor

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT DEFAULT 'landing_page', -- track where signup came from
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick email lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);

-- No RLS needed - this is public signup, but we'll use service role key for inserts
-- Enable RLS but allow inserts without auth
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for signups)
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Only authenticated admin can view (you'll access via Supabase dashboard)
-- No select policy = can't be read via API
