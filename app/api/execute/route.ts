import { NextRequest, NextResponse } from 'next/server';
import { ExecuteResponse, ExecutionResult, ClaudeIntentResponse } from '@/lib/types';
import { generateHMACSignature } from '@/lib/crypto';
import { createAction, updateActionStatus } from '@/lib/supabase';

const N8N_WEBHOOK_URL_NOTION = process.env.N8N_WEBHOOK_URL_NOTION;
const N8N_WEBHOOK_URL_EMAIL = process.env.N8N_WEBHOOK_URL_EMAIL;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  console.log('[Execute API] Starting action execution...');

  try {
    const body = await request.json();
    const { intent, sessionId, transcript } = body as {
      intent: ClaudeIntentResponse;
      sessionId: string;
      transcript: string;
    };

    if (!intent || !sessionId) {
      console.error('[Execute API] Missing required fields');
      return NextResponse.json<ExecuteResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[Execute API] Intent:', intent.intent);
    console.log('[Execute API] Parameters:', intent.parameters);

    // Create action record in database
    const action = await createAction({
      session_id: sessionId,
      transcript: transcript || '',
      intent: intent.intent,
      parameters: intent.parameters,
      execution_status: 'pending',
      execution_result: null,
      proof_link: null,
    });

    if (!action) {
      throw new Error('Failed to create action record');
    }

    console.log('[Execute API] Action created:', action.id);

    // Determine webhook URL based on intent
    let webhookUrl: string | undefined;
    switch (intent.intent) {
      case 'create_task':
        webhookUrl = N8N_WEBHOOK_URL_NOTION;
        break;
      case 'send_email':
        webhookUrl = N8N_WEBHOOK_URL_EMAIL;
        break;
      default:
        throw new Error(`Unsupported intent: ${intent.intent}`);
    }

    if (!webhookUrl) {
      throw new Error(`No webhook URL configured for intent: ${intent.intent}`);
    }

    // Prepare payload for n8n
    const payload = {
      intent: intent.intent,
      parameters: intent.parameters,
      actionId: action.id,
      timestamp: new Date().toISOString(),
    };

    // Generate HMAC signature
    const signature = generateHMACSignature(payload, N8N_WEBHOOK_SECRET);

    console.log('[Execute API] Calling n8n webhook:', webhookUrl);

    // Call n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('[Execute API] Webhook error:', errorText);
      throw new Error(`Webhook request failed: ${webhookResponse.status} - ${errorText}`);
    }

    const result: ExecutionResult = await webhookResponse.json();
    console.log('[Execute API] Webhook response:', result);

    // Update action status
    const proofLink = result.notion_url || undefined;
    await updateActionStatus(action.id, 'completed', result, proofLink);

    console.log('[Execute API] Execution completed successfully');

    return NextResponse.json<ExecuteResponse>({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[Execute API] Error:', error);

    return NextResponse.json<ExecuteResponse>(
      {
        success: false,
        error: error.message || 'Failed to execute action',
      },
      { status: 500 }
    );
  }
}
