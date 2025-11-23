import { NextRequest, NextResponse } from 'next/server';
import { getSessionActions } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('[Conversation History API] Retrieving conversation history...');

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get all actions/conversations for this session
    const history = await getSessionActions(sessionId);

    console.log('[Conversation History API] Retrieved', history.length, 'items');

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('[Conversation History API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve conversation history',
      },
      { status: 500 }
    );
  }
}
