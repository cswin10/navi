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
- When user asks about weather, use intent "get_weather"
- When user asks about news, use intent "get_news"

Respond with JSON:
{
  "intent": "create_task" | "send_email" | "remember" | "get_weather" | "get_news" | "other",
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

    // For get_weather:
    "location": "string (optional, city name - if not provided, use user's location from knowledge base)"

    // For get_news:
    "topic": "string (optional, e.g. 'technology', 'business', 'sports')"
  }
}

Examples:
- User: "create a task" → intent: "other", response: "What should the task be?"
- User: "task about demo tomorrow" → intent: "create_task", response: "I'll create a task 'demo' due tomorrow. Proceed?"
- User: "remember that John's email is john@company.com" → intent: "remember", response: "Got it! I'll remember John's email."
- User: "what's the weather like?" → intent: "get_weather", response: "Let me check the weather for you."
- User: "any news on AI?" → intent: "get_news", response: "Let me find the latest AI news."
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
