import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeIntentResponse, ProcessResponse } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getSessionActions(sessionId: string) {
  const supabase = await createClient();
  const { data } = await (supabase
    .from('actions') as any)
    .select('transcript, execution_result')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  return data || [];
}

function buildSystemPrompt(userName?: string, contextMemory?: any, knowledgeBase?: string) {
  const today = new Date();
  const contextString = contextMemory && typeof contextMemory === 'object' && Object.keys(contextMemory).length > 0
    ? `\n\nQuick Context:\n${Object.entries(contextMemory).map(([key, value]) => `- ${key}: ${value}`).join('\n')}`
    : '';

  const knowledgeBaseString = knowledgeBase && knowledgeBase.trim()
    ? `\n\n${userName ? `${userName}'s` : 'User'} Knowledge Base:\n${knowledgeBase}`
    : '';

  return `You are Navi, ${userName ? `${userName}'s` : 'a'} concise voice-first AI personal operator.

Today's date: ${today.toLocaleDateString('en-GB')} (UK format: DD/MM/YYYY)
Current ISO date: ${today.toISOString().split('T')[0]}

IMPORTANT: User is in UK timezone. When they say "tomorrow", calculate from today's date above.${contextString}${knowledgeBaseString}

You have memory of past conversations. Use context to be helpful and personalized.

IMPORTANT RULES:
- Keep responses SHORT (1-2 sentences max)
- If user says just "create a task" or "send email" without details, use intent "other" and ASK what they want
- Only use create_task or send_email intents when you have ALL required info
- Don't explain what you can do unless asked
- Be direct and conversational
- For dates: Use ISO format (YYYY-MM-DD) in due_date field
- When user says "remember that...", "note that...", "keep in mind...", use intent "remember"
- When user says "create a note about...", "add to my [folder] folder", "note down...", use intent "create_note"
- When user asks about weather, use intent "get_weather"
- When user asks about news, use intent "get_news"
- When user wants to add calendar event(s), use "add_calendar_event" or "timeblock_day"
- When user asks what's on calendar, use "get_calendar_events"
- For timeblocking, parse multiple time blocks from natural language

Respond with JSON:
{
  "intent": "create_task" | "send_email" | "remember" | "get_weather" | "get_news" | "add_calendar_event" | "get_calendar_events" | "timeblock_day" | "create_note" | "other",
  "response": "Brief response",
  "parameters": {
    // For create_task (ALL fields required):
    "title": "string",
    "due_date": "ISO date string (YYYY-MM-DD) or null",
    "priority": "high | medium | low"

    // For send_email (ALL fields required):
    "to": "email@example.com",
    "subject": "string",
    "body": "string"

    // For remember:
    "section": "string (e.g. 'Important Contacts', 'Preferences', 'Current Projects')",
    "content": "string (what to remember)"

    // For create_note:
    "title": "string (short title derived from content)",
    "content": "string (the full note content)",
    "folder": "string (optional, folder name if user specifies - e.g. 'Work', 'Ideas', 'Meeting Notes')"

    // For get_weather:
    "location": "string (optional, city name - if not provided, use user's location from knowledge base)"

    // For get_news:
    "topic": "string (optional, e.g. 'technology', 'business', 'sports')"

    // For add_calendar_event:
    "title": "string",
    "start_time": "string (e.g. '9am', '14:00', '2:30pm')",
    "end_time": "string (optional, e.g. '10am', '15:00', '3:30pm')",
    "description": "string (optional)",
    "location": "string (optional)"

    // For get_calendar_events:
    "date": "ISO date string (optional, YYYY-MM-DD)",
    "timeframe": "day | week | month (optional, default: day)"

    // For timeblock_day:
    "date": "ISO date string (optional, YYYY-MM-DD - defaults to today)",
    "blocks": [
      {
        "start_time": "string (e.g. '9am')",
        "end_time": "string (e.g. '11am')",
        "title": "string",
        "description": "string (optional)"
      }
    ]
  }
}

Examples:
- User: "create a task" → intent: "other", response: "What should the task be?"
- User: "task about demo tomorrow" → intent: "create_task", response: "I'll create a task 'demo' due tomorrow. Proceed?"
- User: "remember that John's email is john@company.com" → intent: "remember", response: "Got it! I'll remember John's email."
- User: "create a note about the quarterly planning session, we discussed budget increases and hiring 3 new engineers" → intent: "create_note", response: "I'll create that note for you."
- User: "add to my work folder: need to follow up with Sarah about the contract terms" → intent: "create_note", response: "Adding that note to your work folder."
- User: "note down the recipe: chicken, garlic, olive oil, cook for 20 minutes at 180 degrees" → intent: "create_note", response: "Got it, creating that note."
- User: "what's the weather like?" → intent: "get_weather", response: "Let me check the weather for you."
- User: "any news on AI?" → intent: "get_news", response: "Let me find the latest AI news."
- User: "add a meeting at 2pm tomorrow" → intent: "add_calendar_event", response: "I'll add a meeting to your calendar at 2pm tomorrow."
- User: "what do I have today?" → intent: "get_calendar_events", response: "Let me check your calendar for today."
- User: "timeblock my day: 9-11am deep work, 11-12pm emails, 1-3pm calls, 3-5pm project work" → intent: "timeblock_day", response: "I'll create those 4 time blocks for today."
- User: "hi" → intent: "other", response: "Hey! What do you need?"`;
}

export async function POST(request: NextRequest) {
  console.log('[Process API] Starting intent parsing...');

  try {
    // Verify authentication
    const user = await getCurrentUser();
    console.log('[Process API] Authenticated user:', user.id);

    const body = await request.json();
    const { text, sessionId } = body;

    if (!text) {
      console.error('[Process API] No text provided');
      return NextResponse.json<ProcessResponse>(
        { success: false, error: 'No text provided' },
        { status: 400 }
      );
    }

    console.log('[Process API] Processing text:', text);

    // Get user profile for personalization
    const supabase = await createClient();
    const { data: profile } = await (supabase
      .from('user_profiles') as any)
      .select('name, context_memory, knowledge_base')
      .eq('id', user.id)
      .single();

    const systemPrompt = buildSystemPrompt(profile?.name, profile?.context_memory, profile?.knowledge_base);

    // Fetch conversation history for context (if sessionId provided)
    let conversationContext = '';
    if (sessionId) {
      const history = await getSessionActions(sessionId);
      if (history.length > 0) {
        conversationContext = '\n\nPrevious conversation history:\n';
        history.slice(-5).forEach((item: any) => { // Last 5 interactions
          conversationContext += `User: ${item.transcript}\n`;
          if (item.execution_result && typeof item.execution_result === 'object' && 'response' in item.execution_result) {
            conversationContext += `Navi: ${item.execution_result.response}\n`;
          }
        });
      }
    }

    // Call Claude API with prompt caching for cost optimization
    // Cache the system prompt and conversation history to reduce costs by 50%+
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        },
        ...(conversationContext ? [{
          type: 'text' as const,
          text: conversationContext,
          cache_control: { type: 'ephemeral' as const }
        }] : [])
      ],
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
    });

    console.log('[Process API] Claude response:', JSON.stringify(message.content, null, 2));

    // Extract text from Claude's response
    const contentBlock = message.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response from Claude
    let intentResponse: ClaudeIntentResponse;
    try {
      // Extract JSON from the response (Claude might wrap it in markdown code blocks)
      const textContent = contentBlock.text;
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      intentResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Process API] Failed to parse Claude response:', parseError);
      throw new Error('Failed to parse intent from Claude response');
    }

    console.log('[Process API] Parsed intent:', intentResponse);

    return NextResponse.json<ProcessResponse>({
      success: true,
      intent: intentResponse,
    });
  } catch (error: any) {
    console.error('[Process API] Error:', error);
    return NextResponse.json<ProcessResponse>(
      {
        success: false,
        error: error.message || 'Failed to process intent',
      },
      { status: 500 }
    );
  }
}
