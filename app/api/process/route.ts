import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeIntentResponse, ProcessResponse } from '@/lib/types';
import { getSessionActions } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Navi, a voice-first AI personal operator. Your job is to understand user requests and propose specific actions.

You have memory of past conversations and can remember details about the user. Use this context to provide personalized responses.

Analyze the user's request and determine the intent. Respond with JSON in this exact format:

{
  "intent": "create_task" | "send_email" | "other",
  "response": "Natural language response confirming what you'll do",
  "parameters": {
    // For create_task:
    "title": "string",
    "due_date": "ISO date string or null",
    "priority": "high | medium | low"

    // For send_email:
    "to": "email@example.com",
    "subject": "string",
    "body": "string"
  }
}

For the response field, write it as if you're speaking to the user: "I'll create a task titled 'X' due tomorrow at 9am. Shall I proceed?"

Be conversational, friendly, and clear.

If the request doesn't match create_task or send_email, use intent: "other" and provide a helpful response explaining what you can do.`;

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
