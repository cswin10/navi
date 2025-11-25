import { NextRequest, NextResponse } from 'next/server';
import { createAction } from '@/lib/supabase';
import { ClaudeIntentResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, transcript, intent } = body as {
      sessionId: string;
      transcript: string;
      intent: ClaudeIntentResponse;
    };

    if (!sessionId || !transcript || !intent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store conversation in actions table with status 'conversational'
    const action = await createAction({
      session_id: sessionId,
      transcript,
      intent: intent.intent,
      parameters: intent.parameters,
      execution_status: 'conversational',
      execution_result: {
        success: true,
        response: intent.response,
      },
      proof_link: null,
    });

    if (!action) {
      throw new Error('Failed to store conversation');
    }

    return NextResponse.json({
      success: true,
      actionId: action.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to store conversation',
      },
      { status: 500 }
    );
  }
}
