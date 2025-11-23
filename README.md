# Navi - Voice-First AI Personal Operator

Navi is a voice-first AI personal operator that executes real actions. Press, speak, confirm, and watch it happen.

## Core Flow

1. **Voice Input** → User presses and holds button, speaks their request
2. **Transcription** → Audio sent to OpenAI Whisper API
3. **Intent Parsing** → Transcribed text processed by Anthropic Claude
4. **Voice Response** → Navi responds with ElevenLabs TTS
5. **Confirmation** → User confirms or cancels the action
6. **Execution** → n8n webhook triggered to execute action (Notion task creation or Gmail send)
7. **Proof** → Display execution result with proof link
8. **Memory** → All actions logged in Supabase

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion
- **Voice Input:** Web Audio API (press-and-hold recording)
- **Transcription:** OpenAI Whisper API
- **Intent Parsing:** Anthropic Claude API (Claude Sonnet 4.5)
- **Text-to-Speech:** ElevenLabs API
- **Actions:** n8n webhooks (HMAC-signed)
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
│   │   └── execute/route.ts        # n8n webhook execution
├── components/
│   ├── VoiceInput.tsx              # Press-and-hold recording button
│   ├── TranscriptDisplay.tsx       # Shows transcribed text
│   ├── ConfirmationPanel.tsx       # Intent confirmation + voice playback
│   └── ProofPanel.tsx              # Execution result display
├── lib/
│   ├── types.ts                    # TypeScript type definitions
│   ├── supabase.ts                 # Supabase client + helpers
│   └── crypto.ts                   # HMAC signature generation
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
- `N8N_WEBHOOK_URL_NOTION` - Your n8n Notion webhook URL
- `N8N_WEBHOOK_URL_EMAIL` - Your n8n Gmail webhook URL
- `N8N_WEBHOOK_SECRET` - Generate with `openssl rand -hex 32`
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

### 4. n8n Workflows Setup

You need to create two n8n workflows:

#### Workflow 1: Notion Task Creation

1. Create a new workflow in n8n
2. Add a **Webhook** node as trigger:
   - **HTTP Method:** POST
   - **Path:** `notion-task` (or your preferred path)
   - **Authentication:** Header Auth
     - **Header Name:** `X-Signature`
     - **Value:** Use HMAC verification (see below)

3. Add a **Function** node to verify HMAC signature:

```javascript
const crypto = require('crypto');

const payload = JSON.stringify($json);
const signature = $node["Webhook"].json.headers['x-signature'];
const secret = 'YOUR_N8N_WEBHOOK_SECRET'; // Same as in .env.local

const hmac = crypto.createHmac('sha256', secret);
hmac.update(payload);
const expectedSignature = hmac.digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}

return $json;
```

4. Add a **Notion** node:
   - **Operation:** Create Database Page
   - **Database ID:** Your Notion database ID
   - **Properties:**
     - **Title:** `{{$json.parameters.title}}`
     - **Due Date:** `{{$json.parameters.due_date}}`
     - **Priority:** `{{$json.parameters.priority}}`

5. Add a **Function** node to format response:

```javascript
return {
  success: true,
  task_id: $json.id,
  notion_url: $json.url
};
```

6. Activate the workflow and copy the webhook URL to `N8N_WEBHOOK_URL_NOTION`

#### Workflow 2: Gmail Send

1. Create a new workflow in n8n
2. Add a **Webhook** node as trigger (same HMAC verification as above)
3. Add a **Gmail** node:
   - **Operation:** Send Email
   - **To:** `{{$json.parameters.to}}`
   - **Subject:** `{{$json.parameters.subject}}`
   - **Message:** `{{$json.parameters.body}}`

4. Add a **Function** node to format response:

```javascript
return {
  success: true,
  message_id: $json.id
};
```

5. Activate the workflow and copy the webhook URL to `N8N_WEBHOOK_URL_EMAIL`

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
- `POST /api/execute` - n8n webhook execution

### Key Components

- **VoiceInput** - Press-and-hold recording with Web Audio API
- **TranscriptDisplay** - Shows what the user said
- **ConfirmationPanel** - Displays intent and plays voice response
- **ProofPanel** - Shows execution results with proof links

## Security Notes

- All n8n webhooks are secured with HMAC signatures
- Supabase RLS is enabled (policies should be tightened for production)
- API keys are stored in environment variables
- Client-side uses anon key only, server uses service key

## Production Checklist

- [ ] Tighten Supabase RLS policies
- [ ] Add user authentication
- [ ] Implement rate limiting
- [ ] Add error tracking (Sentry)
- [ ] Set up monitoring
- [ ] Configure CORS properly
- [ ] Use production n8n instance
- [ ] Rotate API keys regularly

## V1 Scope

**Included:**
- ✅ Voice recording (press-and-hold)
- ✅ Whisper transcription
- ✅ Claude intent parsing (create_task, send_email)
- ✅ ElevenLabs voice response
- ✅ Confirmation flow
- ✅ n8n webhook execution with HMAC
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
- Verify n8n workflows are active
- Check `N8N_WEBHOOK_SECRET` matches in both places
- Test n8n webhooks directly with curl
- Review n8n workflow execution logs

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
