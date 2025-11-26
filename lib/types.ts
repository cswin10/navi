// Core intent types
export type IntentType = 'create_task' | 'get_tasks' | 'update_task' | 'delete_task' | 'send_email' | 'remember' | 'get_weather' | 'get_news' | 'add_calendar_event' | 'get_calendar_events' | 'delete_calendar_event' | 'timeblock_day' | 'create_note' | 'get_notes' | 'other';

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

export interface GetWeatherParams {
  location?: string; // Optional, defaults to user's location from knowledge base
}

export interface GetNewsParams {
  topic?: string; // Optional, defaults to general news
}

export interface AddCalendarEventParams {
  title: string;
  date?: string; // ISO date (YYYY-MM-DD) or 'today', 'tomorrow'
  start_time: string; // Time like '9am', '14:00', '2:30pm'
  end_time?: string; // Time (optional, defaults to 1 hour)
  description?: string;
  location?: string;
}

export interface GetCalendarEventsParams {
  date?: string; // 'today', 'tomorrow', or ISO date
  timeframe?: 'day' | 'week' | 'month';
}

export interface DeleteCalendarEventParams {
  title?: string; // Event title to search for (fuzzy match) - optional if deleting all
  date?: string; // Optional date to narrow search ('today', 'tomorrow', or ISO date)
  delete_all?: boolean; // If true, delete all events (for the specified date)
}

export interface GetTasksParams {
  status?: 'all' | 'todo' | 'in_progress' | 'done'; // Filter by status, defaults to 'todo'
  priority?: Priority; // Optional filter by priority
}

export interface UpdateTaskParams {
  title: string; // Title to search for (fuzzy match)
  status?: 'todo' | 'in_progress' | 'done'; // New status
  priority?: Priority; // New priority
}

export interface DeleteTaskParams {
  title?: string; // Task title to search for (fuzzy match) - optional if deleting all
  delete_all?: boolean; // If true, delete all tasks (requires confirmation)
  status?: 'todo' | 'in_progress' | 'done' | 'all'; // Filter by status when deleting multiple
}

export interface GetNotesParams {
  query?: string; // Search query (searches title and content)
  folder?: string; // Filter by folder
}

export interface TimeblockDayParams {
  date?: string; // 'today', 'tomorrow', or ISO date (defaults to today)
  blocks: Array<{
    start_time: string; // e.g., "9am", "14:00"
    end_time: string; // e.g., "11am", "16:00"
    title: string; // e.g., "Deep work", "Client calls"
    description?: string;
  }>;
}

export interface CreateNoteParams {
  title: string;
  content: string;
  folder?: string; // Optional folder name
}

export type IntentParams = CreateTaskParams | GetTasksParams | UpdateTaskParams | DeleteTaskParams | SendEmailParams | RememberParams | GetWeatherParams | GetNewsParams | AddCalendarEventParams | GetCalendarEventsParams | DeleteCalendarEventParams | TimeblockDayParams | CreateNoteParams | GetNotesParams | Record<string, unknown>;

// Claude API Response (single intent)
export interface ClaudeIntentResponse {
  intent: IntentType;
  response: string;
  parameters: IntentParams;
}

// Claude API Response (multiple intents)
export interface ClaudeMultiIntentResponse {
  intents: ClaudeIntentResponse[];
  response: string; // Combined response for all intents
}

// Transcription API Response
export interface TranscriptionResponse {
  success: boolean;
  text?: string;
  error?: string;
}

// Process API Response (supports both single and multiple intents)
export interface ProcessResponse {
  success: boolean;
  intent?: ClaudeIntentResponse; // Single intent
  intents?: ClaudeIntentResponse[]; // Multiple intents
  response?: string; // Combined response for multiple intents
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
  response?: string;  // Full response (shown on screen and spoken)
  displayResponse?: string;  // Detailed response shown on screen only
  spokenResponse?: string;  // Brief response for TTS only
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
  intents?: ClaudeIntentResponse[]; // For multiple intents
  audioUrl: string | null;
  executionResult: ExecutionResult | null;
  error: string | null;
}
