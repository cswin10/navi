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
 * Generate capitalization variations for a property name
 * e.g., "due date" -> ["due date", "Due Date", "Due date", "DUE DATE"]
 */
function generateCapitalizations(name: string): string[] {
  const variations = new Set<string>();

  // Original
  variations.add(name);

  // All lowercase
  variations.add(name.toLowerCase());

  // Title Case (Each Word Capitalized)
  variations.add(name.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' '));

  // First word capitalized only
  const words = name.split(' ');
  if (words.length > 0) {
    variations.add(
      words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() +
      (words.length > 1 ? ' ' + words.slice(1).join(' ').toLowerCase() : '')
    );
  }

  // ALL CAPS
  variations.add(name.toUpperCase());

  return Array.from(variations);
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

    // Step 1: Find the correct title property name by trying with just the title
    const titleBaseNames = ['task', 'name', 'title', 'todo', 'item'];
    let titlePropertyName: string | null = null;
    let lastTitleError;

    console.log('[Notion] Step 1: Finding title property name...');

    for (const base of titleBaseNames) {
      const variations = generateCapitalizations(base);

      for (const titleProp of variations) {
        try {
          console.log(`[Notion] Trying title property: "${titleProp}"`);

          const testResponse = await notion.pages.create({
            parent: {
              database_id: notionDatabaseId,
            },
            properties: {
              [titleProp]: {
                title: [{ text: { content: params.title } }],
              },
            },
          });

          titlePropertyName = titleProp;
          console.log(`[Notion] ✓ Found working title property: "${titleProp}"`);

          // If we don't need optional fields, we're done!
          if (!dueDate && !params.priority) {
            console.log('[Notion] Task created (title only):', testResponse.id);
            const pageId = testResponse.id.replace(/-/g, '');
            return {
              success: true,
              task_id: testResponse.id,
              notion_url: `https://www.notion.so/${pageId}`,
            };
          }

          // Delete the test page since we'll create a proper one with all fields
          try {
            await notion.pages.update({
              page_id: testResponse.id,
              archived: true,
            });
          } catch (e) {
            // Ignore deletion errors
          }

          break; // Found it, exit variations loop
        } catch (error: any) {
          lastTitleError = error;
          if (!error.body?.message?.includes('does not exist')) {
            // Not a property name issue, throw it
            throw error;
          }
        }
      }

      if (titlePropertyName) break; // Found it, exit base names loop
    }

    if (!titlePropertyName) {
      throw new Error(`Could not find title property. Tried: ${titleBaseNames.join(', ')} with various capitalizations. Last error: ${lastTitleError?.body?.message || lastTitleError?.message}`);
    }

    // Step 2: Now create the final page with optional fields
    console.log('[Notion] Step 2: Creating page with optional fields...');

    const properties: any = {
      [titlePropertyName]: {
        title: [{ text: { content: params.title } }],
      },
    };

    // Try to add due date
    if (dueDate) {
      const dueDateBaseNames = ['due date', 'due', 'date', 'deadline'];
      let dueDateAdded = false;

      for (const base of dueDateBaseNames) {
        if (dueDateAdded) break;
        const variations = generateCapitalizations(base);

        for (const dueDateProp of variations) {
          properties[dueDateProp] = {
            date: { start: dueDate },
          };

          // Test if this property works
          try {
            console.log(`[Notion] Trying due date property: "${dueDateProp}"`);
            await notion.pages.create({
              parent: { database_id: notionDatabaseId },
              properties: {
                [titlePropertyName]: {
                  title: [{ text: { content: '_test_' } }],
                },
                [dueDateProp]: {
                  date: { start: dueDate },
                },
              },
            }).then(async (testPage) => {
              // Clean up test page
              await notion.pages.update({ page_id: testPage.id, archived: true }).catch(() => {});
            });

            console.log(`[Notion] ✓ Found due date property: "${dueDateProp}"`);
            dueDateAdded = true;
            break;
          } catch (e: any) {
            delete properties[dueDateProp]; // Remove if it didn't work
            if (!e.body?.message?.includes('does not exist')) {
              console.log(`[Notion] Due date property "${dueDateProp}" exists but errored, skipping optional fields`);
              break;
            }
          }
        }
      }

      if (!dueDateAdded) {
        console.log('[Notion] Could not find due date property, proceeding without it');
      }
    }

    // Try to add priority
    if (params.priority) {
      const priorityBaseNames = ['priority level', 'priority', 'importance'];
      let priorityAdded = false;

      for (const base of priorityBaseNames) {
        if (priorityAdded) break;
        const variations = generateCapitalizations(base);

        for (const priorityProp of variations) {
          properties[priorityProp] = {
            select: {
              name: params.priority.charAt(0).toUpperCase() + params.priority.slice(1),
            },
          };

          // Test if this property works
          try {
            console.log(`[Notion] Trying priority property: "${priorityProp}"`);
            await notion.pages.create({
              parent: { database_id: notionDatabaseId },
              properties: {
                [titlePropertyName]: {
                  title: [{ text: { content: '_test_' } }],
                },
                [priorityProp]: {
                  select: {
                    name: params.priority.charAt(0).toUpperCase() + params.priority.slice(1),
                  },
                },
              },
            }).then(async (testPage) => {
              // Clean up test page
              await notion.pages.update({ page_id: testPage.id, archived: true }).catch(() => {});
            });

            console.log(`[Notion] ✓ Found priority property: "${priorityProp}"`);
            priorityAdded = true;
            break;
          } catch (e: any) {
            delete properties[priorityProp]; // Remove if it didn't work
            if (!e.body?.message?.includes('does not exist')) {
              console.log(`[Notion] Priority property "${priorityProp}" exists but errored, skipping`);
              break;
            }
          }
        }
      }

      if (!priorityAdded) {
        console.log('[Notion] Could not find priority property, proceeding without it');
      }
    }

    // Step 3: Create the final page with all working properties
    console.log('[Notion] Step 3: Creating final page with properties:', Object.keys(properties).join(', '));

    const response = await notion.pages.create({
      parent: {
        database_id: notionDatabaseId,
      },
      properties,
    });

    console.log('[Notion] Task created successfully:', response.id);

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
