// Database types for NaviOS
// Generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          preferences: Json
          context_memory: Json
          knowledge_base: string
          email_signature: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          preferences?: Json
          context_memory?: Json
          knowledge_base?: string
          email_signature?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          preferences?: Json
          context_memory?: Json
          knowledge_base?: string
          email_signature?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_integrations: {
        Row: {
          id: string
          user_id: string
          integration_type: string
          credentials: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_type: string
          credentials: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_type?: string
          credentials?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          notes: string | null
          priority: 'high' | 'medium' | 'low'
          status: 'todo' | 'in_progress' | 'done'
          due_date: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          notes?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'todo' | 'in_progress' | 'done'
          due_date?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          notes?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'todo' | 'in_progress' | 'done'
          due_date?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          reminder_time: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          reminder_time: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          reminder_time?: string
          completed?: boolean
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      actions: {
        Row: {
          id: string
          user_id: string
          session_id: string
          transcript: string
          intent: string
          parameters: Json
          execution_status: string
          execution_result: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          transcript: string
          intent: string
          parameters: Json
          execution_status?: string
          execution_result?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          transcript?: string
          intent?: string
          parameters?: Json
          execution_status?: string
          execution_result?: Json | null
          created_at?: string
        }
      }
    }
  }
}
