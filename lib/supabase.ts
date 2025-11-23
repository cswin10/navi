import { createClient } from '@supabase/supabase-js';
import { Session, Action } from './types';

// Client-side Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side Supabase client with service key (for API routes)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Database helper functions
export async function createSession(userId: string | null = null): Promise<Session | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

export async function createAction(action: Omit<Action, 'id' | 'created_at'>): Promise<Action | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('actions')
      .insert(action)
      .select()
      .single();

    if (error) {
      console.error('Error creating action:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating action:', error);
    return null;
  }
}

export async function updateActionStatus(
  actionId: string,
  status: string,
  result: any,
  proofLink?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('actions')
      .update({
        execution_status: status,
        execution_result: result,
        proof_link: proofLink || null,
      })
      .eq('id', actionId);

    if (error) {
      console.error('Error updating action status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating action status:', error);
    return false;
  }
}

export async function getSessionActions(sessionId: string): Promise<Action[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('actions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting session actions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting session actions:', error);
    return [];
  }
}

/*
SUPABASE SCHEMA - Run this SQL in your Supabase SQL Editor:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT
);

-- Actions table
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transcript TEXT NOT NULL,
  intent TEXT NOT NULL,
  parameters JSONB NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'pending',
  execution_result JSONB,
  proof_link TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_actions_session_id ON actions(session_id);
CREATE INDEX idx_actions_created_at ON actions(created_at DESC);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Create policies (for V1, allow all operations - tighten this in production)
CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on actions" ON actions
  FOR ALL USING (true) WITH CHECK (true);
*/
