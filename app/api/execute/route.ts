import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ExecuteResponse, ExecutionResult, ClaudeIntentResponse, CreateTaskParams, SendEmailParams, RememberParams } from '@/lib/types';
import { getCurrentUser, createClient } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import type { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  console.log('[Execute API] Starting action execution...');

  try {
    // Verify authentication
    const user = await getCurrentUser();
    console.log('[Execute API] Authenticated user:', user.id);

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

    const supabase = await createClient();

    // Create action record in database
    const { data: action, error: actionError } = await (supabase
      .from('actions') as any)
      .insert({
        user_id: user.id,
        session_id: sessionId,
        transcript: transcript || '',
        intent: intent.intent,
        parameters: intent.parameters,
        execution_status: 'pending',
        execution_result: null,
      })
      .select()
      .single();

    if (actionError || !action) {
      throw new Error('Failed to create action record');
    }

    console.log('[Execute API] Action created:', action.id);

    let result: ExecutionResult;

    // Execute based on intent type
    switch (intent.intent) {
      case 'create_task':
        result = await executeCreateTask(user.id, intent.parameters as CreateTaskParams);
        break;

      case 'send_email':
        result = await executeSendEmail(user.id, intent.parameters as SendEmailParams);
        break;

      case 'remember':
        result = await executeRemember(user.id, intent.parameters as RememberParams);
        break;

      default:
        throw new Error(`Unknown intent: ${intent.intent}`);
    }

    // Update action status
    await (supabase
      .from('actions') as any)
      .update({
        execution_status: result.success ? 'completed' : 'failed',
        execution_result: result,
      })
      .eq('id', action.id);

    console.log('[Execute API] Execution complete:', result.success);

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

/**
 * Create a task in NaviOS database
 */
async function executeCreateTask(userId: string, params: CreateTaskParams): Promise<ExecutionResult> {
  try {
    console.log('[Execute] Creating task:', params);

    const supabase = await createClient();

    // Create task in database
    const { data: task, error } = await (supabase
      .from('tasks') as any)
      .insert({
        user_id: userId,
        title: params.title,
        priority: params.priority || 'medium',
        status: 'todo',
        due_date: params.due_date,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[Execute] Task created:', task.id);

    return {
      success: true,
      response: `Task created: ${params.title}`,
    };
  } catch (error: any) {
    console.error('[Execute] Task creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create task',
    };
  }
}

/**
 * Send an email using user's connected email account
 */
async function executeSendEmail(userId: string, params: SendEmailParams): Promise<ExecutionResult> {
  try {
    console.log('[Execute] Sending email:', { to: params.to, subject: params.subject });

    const supabase = await createClient();

    // Get user's email integration
    const { data: integration, error: integrationError } = await (supabase
      .from('user_integrations') as any)
      .select('credentials')
      .eq('user_id', userId)
      .eq('integration_type', 'email')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      throw new Error('No email account connected. Please connect your email in Settings → Integrations.');
    }

    // Decrypt credentials
    const credentials = integration.credentials as { email: string; app_password: string };
    const decryptedPassword = decrypt(credentials.app_password);

    // Create transporter with user's credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: credentials.email,
        pass: decryptedPassword,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: credentials.email,
      to: params.to,
      subject: params.subject,
      text: params.body,
    });

    console.log('[Execute] Email sent:', info.messageId);

    return {
      success: true,
      response: `Email sent successfully to ${params.to}`,
    };
  } catch (error: any) {
    console.error('[Execute] Email send failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Add information to user's knowledge base
 */
async function executeRemember(userId: string, params: RememberParams): Promise<ExecutionResult> {
  try {
    console.log('[Execute] Adding to knowledge base:', params);

    const supabase = await createClient();

    // Get current knowledge base
    const { data: profile } = await (supabase
      .from('user_profiles') as any)
      .select('knowledge_base')
      .eq('id', userId)
      .single();

    const currentKnowledgeBase = profile?.knowledge_base || '';

    // Format the new entry
    const timestamp = new Date().toLocaleDateString('en-GB');
    const newEntry = `\n\n## ${params.section}\n[Added: ${timestamp}]\n${params.content}`;

    // Append to knowledge base
    const updatedKnowledgeBase = currentKnowledgeBase + newEntry;

    const { error } = await (supabase
      .from('user_profiles') as any)
      .update({
        knowledge_base: updatedKnowledgeBase,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update knowledge base: ${error.message}`);
    }

    console.log('[Execute] Knowledge base updated');

    return {
      success: true,
      response: `Got it! I've added that to your knowledge base under "${params.section}".`,
    };
  } catch (error: any) {
    console.error('[Execute] Remember failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to save to knowledge base',
    };
  }
}
