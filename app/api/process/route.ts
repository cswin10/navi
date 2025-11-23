import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeIntentResponse, ProcessResponse } from '@/lib/types';
import { getSessionActions } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Navi, a concise voice-first AI personal operator.

You have memory of past conversations. Use context to be helpful.

IMPORTANT RULES:
- Keep responses SHORT (1-2 sentences max)
- If user says just "create a task" or "send email" without details, use intent "other" and ASK what they want
- Only use create_task or send_email intents when you have ALL required info
- Don't explain what you can do unless asked
- Be direct and conversational

Respond with JSON:
{
  "intent": "create_task" | "send_email" | "other",
  "response": "Brief response",
  "parameters": {
    // For create_task (ALL fields required):
    "title": "string",
    "due_date": "ISO date string or null",
    "priority": "high | medium | low"

    // For send_email (ALL fields required):
    "to": "email@example.com",
    "subject": "string",
    "body": "string"
  }
}

Examples:
- User: "create a task" → intent: "other", response: "What should the task be?"
- User: "task about demo tomorrow" → intent: "create_task", response: "I'll create a task 'demo' due tomorrow. Proceed?"
- User: "hi" → intent: "other", response: "Hey! What do you need?"`;


export async function POST(request: NextRequest) {
  console.log('[Process API] Starting intent parsing...');

  try {
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

    // Fetch conversation history for context (if sessionId provided)
    let conversationContext = '';
    if (sessionId) {
      const history = await getSessionActions(sessionId);
      if (history.length > 0) {
        conversationContext = '\n\nPrevious conversation history:\n';
        history.slice(-5).forEach((item) => { // Last 5 interactions
          conversationContext += `User: ${item.transcript}\n`;
          if (item.execution_result && typeof item.execution_result === 'object' && 'response' in item.execution_result) {
            conversationContext += `Navi: ${item.execution_result.response}\n`;
          }
        });
      }
    }

    // Call Claude API with conversation context
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + conversationContext,
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
