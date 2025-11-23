import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import nodemailer from 'nodemailer';
import { ExecuteResponse, ExecutionResult, ClaudeIntentResponse, CreateTaskParams, SendEmailParams } from '@/lib/types';
import { createAction, updateActionStatus } from '@/lib/supabase';

// Lazy initialize Notion client
function getNotionClient() {
  return new Client({
    auth: process.env.NOTION_API_KEY,
  });
}

// Format Notion ID to UUID format (with hyphens)
function formatNotionId(id: string): string {
  // Remove any existing hyphens
  const clean = id.replace(/-/g, '');

  // If already 32 characters, format as UUID: 8-4-4-4-12
  if (clean.length === 32) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }

  // Otherwise return as-is
  return id;
}

// Lazy initialize Gmail transporter
function getGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
  });
}

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

    let result: ExecutionResult;

    // Execute based on intent type
    switch (intent.intent) {
      case 'create_task':
        result = await executeNotionTask(intent.parameters as CreateTaskParams);
        break;
      case 'send_email':
        result = await executeGmailSend(intent.parameters as SendEmailParams);
        break;
      default:
        throw new Error(`Unsupported intent: ${intent.intent}`);
    }

    console.log('[Execute API] Execution result:', result);

    // Update action status
    const proofLink = result.notion_url || undefined;
    await updateActionStatus(action.id, result.success ? 'completed' : 'failed', result, proofLink);

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

/**
 * Create a task in Notion
 */
async function executeNotionTask(params: CreateTaskParams): Promise<ExecutionResult> {
  try {
    console.log('[Notion] Creating task:', params);

    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseIdRaw = process.env.NOTION_DATABASE_ID;

    if (!notionApiKey) {
      throw new Error('NOTION_API_KEY not configured');
    }
    if (!notionDatabaseIdRaw) {
      throw new Error('NOTION_DATABASE_ID not configured');
    }

    // Format database ID to UUID format with hyphens
    const notionDatabaseId = formatNotionId(notionDatabaseIdRaw);
    console.log('[Notion] Database ID (formatted):', notionDatabaseId);

    // Parse due date
    let dueDate = null;
    if (params.due_date) {
      try {
        dueDate = new Date(params.due_date).toISOString().split('T')[0];
      } catch (e) {
        console.warn('[Notion] Invalid due date:', params.due_date);
      }
    }

    // Create page in Notion database
    const notion = getNotionClient();

    console.log('[Notion] Creating page in database:', notionDatabaseId);

    // List of common title property names to try (case-sensitive)
    const titlePropertyNames = ['task', 'Task', 'Name', 'Title', 'Todo', 'Item', 'To-do'];

    let response;
    let lastError;
    let successfulTitleProp: string | null = null;

    // Try each common property name
    for (const titleProp of titlePropertyNames) {
      try {
        console.log(`[Notion] Attempting to create page with title property: "${titleProp}"`);

        const properties: any = {
          [titleProp]: {
            title: [
              {
                text: {
                  content: params.title,
                },
              },
            ],
          },
        };

        // Add optional fields if they exist
        if (dueDate) {
          properties['due date'] = {
            date: {
              start: dueDate,
            },
          };
        }

        if (params.priority) {
          properties['priority level'] = {
            select: {
              name: params.priority.charAt(0).toUpperCase() + params.priority.slice(1),
            },
          };
        }

        response = await notion.pages.create({
          parent: {
            database_id: notionDatabaseId,
          },
          properties,
        });

        successfulTitleProp = titleProp;
        console.log(`[Notion] Success! Title property name is: "${titleProp}"`);
        break; // Success, exit loop
      } catch (createError: any) {
        console.log(`[Notion] Failed with "${titleProp}":`, createError.body?.message);
        lastError = createError;

        // If it's not a property name issue, throw immediately
        if (!createError.body?.message?.includes('does not exist')) {
          throw createError;
        }
        // Otherwise, try the next property name
      }
    }

    // If we tried all property names and none worked
    if (!response) {
      console.error('[Notion] All title property attempts failed');
      throw new Error(`Could not create Notion task. Tried property names: ${titlePropertyNames.join(', ')}.
Please check your Notion database columns and update NOTION_DATABASE_ID if needed.
Last error: ${lastError?.body?.message || lastError?.message}`);
    }

    console.log('[Notion] Task created:', response.id);

    // Construct Notion URL from page ID
    const pageId = response.id.replace(/-/g, '');
    const notionUrl = `https://www.notion.so/${pageId}`;

    return {
      success: true,
      task_id: response.id,
      notion_url: notionUrl,
    };
  } catch (error: any) {
    console.error('[Notion] Error creating task:', error);
    return {
      success: false,
      error: error.message || 'Failed to create Notion task',
    };
  }
}

/**
 * Send email via Gmail
 */
async function executeGmailSend(params: SendEmailParams): Promise<ExecutionResult> {
  try {
    console.log('[Gmail] Sending email to:', params.to);

    // Send email
    const gmailTransporter = getGmailTransporter();
    const info = await gmailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: params.to,
      subject: params.subject,
      text: params.body,
      html: `<p>${params.body.replace(/\n/g, '<br>')}</p>`,
    });

    console.log('[Gmail] Email sent:', info.messageId);

    return {
      success: true,
      message_id: info.messageId,
    };
  } catch (error: any) {
    console.error('[Gmail] Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}
