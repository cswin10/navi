// Core intent types
export type IntentType = 'create_task' | 'send_email' | 'remember' | 'other';

export type Priority = 'high' | 'medium' | 'low';

export type ExecutionStatus = 'pending' | 'completed' | 'failed' | 'conversational';

// Parameters for different intent types
export interface CreateTaskParams {
  title: string;
  due_date: string | null;
  priority: Priority;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export interface RememberParams {
  section: string;
  content: string;
}

export type IntentParams = CreateTaskParams | SendEmailParams | RememberParams | Record<string, unknown>;

// Claude API Response
export interface ClaudeIntentResponse {
  intent: IntentType;
  response: string;
  parameters: IntentParams;
}

// Transcription API Response
export interface TranscriptionResponse {
  success: boolean;
  text?: string;
  error?: string;
}

// Process API Response
export interface ProcessResponse {
  success: boolean;
  intent?: ClaudeIntentResponse;
  error?: string;
}

// TTS API Response
export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

// Execution result from n8n
export interface ExecutionResult {
  success: boolean;
  task_id?: string;
  notion_url?: string;
  message_id?: string;
  response?: string;  // For conversational interactions
  error?: string;
}

// Execute API Response
export interface ExecuteResponse {
  success: boolean;
  result?: ExecutionResult;
  error?: string;
}

// Supabase Database Types
export interface Session {
  id: string;
  created_at: string;
  user_id: string | null;
}

export interface Action {
  id: string;
  session_id: string;
  created_at: string;
  transcript: string;
  intent: string;
  parameters: IntentParams;
  execution_status: ExecutionStatus;
  execution_result: ExecutionResult | null;
  proof_link: string | null;
}

// UI State Types
export type AppState = 'idle' | 'recording' | 'transcribing' | 'processing' | 'confirming' | 'executing' | 'completed' | 'error';

export interface ActionState {
  transcript: string;
  intent: ClaudeIntentResponse | null;
  audioUrl: string | null;
  executionResult: ExecutionResult | null;
  error: string | null;
}
