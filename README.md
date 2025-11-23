# Navi - Voice-First AI Personal Operator

Navi is a voice-first AI personal operator that executes real actions. Press, speak, confirm, and watch it happen.

## Core Flow

1. **Voice Input** → User presses and holds button, speaks their request
2. **Transcription** → Audio sent to OpenAI Whisper API
3. **Intent Parsing** → Transcribed text processed by Anthropic Claude
4. **Voice Response** → Navi responds with ElevenLabs TTS
5. **Confirmation** → User confirms or cancels the action
6. **Execution** → Direct API calls to Notion or Gmail (no middleman!)
7. **Proof** → Display execution result with proof link
8. **Memory** → All actions logged in Supabase

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion
- **Voice Input:** Web Audio API (press-and-hold recording)
- **Transcription:** OpenAI Whisper API
- **Intent Parsing:** Anthropic Claude API (Claude Sonnet 4.5)
- **Text-to-Speech:** ElevenLabs API
- **Actions:** Direct Notion API & Gmail (Nodemailer)
- **Database:** Supabase (PostgreSQL)

## Project Structure

```
navi/
├── app/
│   ├── page.tsx                    # Main voice interface
│   ├── layout.tsx                  # App layout
│   ├── globals.css                 # Global styles
│   ├── api/
│   │   ├── transcribe/route.ts     # Whisper API integration
│   │   ├── process/route.ts        # Claude intent parsing
│   │   ├── speak/route.ts          # ElevenLabs TTS
│   │   └── execute/route.ts        # Direct Notion & Gmail execution
├── components/
│   ├── VoiceInput.tsx              # Press-and-hold recording button
│   ├── TranscriptDisplay.tsx       # Shows transcribed text
│   ├── ConfirmationPanel.tsx       # Intent confirmation + voice playback
│   └── ProofPanel.tsx              # Execution result display
├── lib/
│   ├── types.ts                    # TypeScript type definitions
│   └── supabase.ts                 # Supabase client + helpers
└── public/
```

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd navi
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your API keys:

```bash
cp .env.local.example .env.local
```

Required environment variables:

- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/settings/keys
- `ELEVENLABS_API_KEY` - Get from https://elevenlabs.io/app/settings/api-keys
- `NOTION_API_KEY` - Get from https://www.notion.so/my-integrations
- `NOTION_DATABASE_ID` - The ID of your Notion database
- `GMAIL_USER` - Your Gmail address
- `GMAIL_APP_PASSWORD` - Gmail App Password (generate from https://myaccount.google.com/apppasswords)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_KEY` - Your Supabase service key

### 3. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the following schema:

```sql
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

-- Create policies (for V1, allow all operations)
CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on actions" ON actions
  FOR ALL USING (true) WITH CHECK (true);
```

3. Get your project URL and keys from Settings → API

### 4. Notion Setup

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Give it a name (e.g., "Navi")
4. Select the workspace where your database is
5. Copy the **Internal Integration Token** → This is your `NOTION_API_KEY`

#### Step 2: Create a Notion Database

1. Create a new database in Notion (or use existing)
2. Add these properties to your database:
   - **Name** (Title) - Default property
   - **Due Date** (Date) - Optional
   - **Priority** (Select with options: High, Medium, Low) - Optional

3. Get your database ID:
   - Open the database as a full page
   - Copy the URL: `https://notion.so/workspace/DATABASE_ID?v=...`
   - The `DATABASE_ID` is the long string between the last `/` and `?`
   - Example: In `https://notion.so/myworkspace/a8aec43384f447ed84390e8e42c2e089?v=...`
   - Database ID is: `a8aec43384f447ed84390e8e42c2e089`

4. Share the database with your integration:
   - Open the database
   - Click **"•••"** (top right)
   - Click **"Add connections"**
   - Select your integration (e.g., "Navi")

#### Step 3: Set up Gmail

1. **Enable 2-Step Verification** on your Google account:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification" if not already on

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (name it "Navi")
   - Click **"Generate"**
   - Copy the 16-character password → This is your `GMAIL_APP_PASSWORD`

3. Your `GMAIL_USER` is just your regular Gmail address (e.g., `yourname@gmail.com`)

### 5. Run the App

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Usage

1. **Press and hold** the microphone button
2. **Speak** your command (e.g., "Create a task titled 'Review quarterly report' due tomorrow")
3. **Release** the button when done speaking
4. **Wait** for Navi to process and respond
5. **Listen** to Navi's voice confirmation
6. **Confirm** or cancel the action
7. **See** the proof of execution

## Supported Commands

### Create Task
- "Create a task titled 'X' due tomorrow"
- "Add a high priority task called 'Y'"
- "Make a task for 'Z' due next week"

### Send Email
- "Send an email to john@example.com with subject 'Meeting' and body 'Let's meet tomorrow'"
- "Email sarah@company.com about the project update"

## Development

### API Endpoints

- `POST /api/transcribe` - Whisper transcription
- `POST /api/process` - Claude intent parsing
- `POST /api/speak` - ElevenLabs TTS
- `POST /api/execute` - Direct Notion & Gmail execution

### Key Components

- **VoiceInput** - Press-and-hold recording with Web Audio API
- **TranscriptDisplay** - Shows what the user said
- **ConfirmationPanel** - Displays intent and plays voice response
- **ProofPanel** - Shows execution results with proof links

## Security Notes

- Direct API integrations (no third-party webhooks)
- Supabase RLS is enabled (policies should be tightened for production)
- API keys are stored in environment variables (never exposed to client)
- Client-side uses Supabase anon key only, server uses service key
- Gmail uses App Passwords (not main account password)

## Production Checklist

- [ ] Tighten Supabase RLS policies
- [ ] Add user authentication
- [ ] Implement rate limiting
- [ ] Add error tracking (Sentry)
- [ ] Set up monitoring
- [ ] Configure CORS properly
- [ ] Rotate API keys regularly
- [ ] Review and limit Notion integration permissions
- [ ] Set up email sending limits to prevent abuse

## V1 Scope

**Included:**
- ✅ Voice recording (press-and-hold)
- ✅ Whisper transcription
- ✅ Claude intent parsing (create_task, send_email)
- ✅ ElevenLabs voice response
- ✅ Confirmation flow
- ✅ Direct Notion & Gmail API integration
- ✅ Proof display
- ✅ Supabase logging

**Not Included (Future):**
- ❌ Wake word detection
- ❌ Continuous conversation
- ❌ Complex memory/embeddings
- ❌ Calendar integration
- ❌ Multiple tool integrations
- ❌ Team features
- ❌ User authentication

## Troubleshooting

### Microphone not working
- Check browser permissions
- Ensure HTTPS or localhost
- Try a different browser

### Transcription fails
- Check `OPENAI_API_KEY` is valid
- Ensure audio is being recorded (check console logs)
- Verify microphone is producing sound

### Intent parsing fails
- Check `ANTHROPIC_API_KEY` is valid
- Review Claude API quota/limits
- Check console logs for error details

### Voice response not playing
- Check `ELEVENLABS_API_KEY` is valid
- Verify browser supports audio playback
- Check console for audio errors

### Execution fails

**Notion tasks:**
- Check `NOTION_API_KEY` is valid
- Verify `NOTION_DATABASE_ID` is correct
- Ensure database is shared with your integration
- Check database properties match (Name, Due Date, Priority)
- Review Vercel/server logs for error details

**Gmail:**
- Check `GMAIL_USER` is correct
- Verify `GMAIL_APP_PASSWORD` is valid (16 characters)
- Ensure 2-Step Verification is enabled on Google account
- Try generating a new App Password if issues persist

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
