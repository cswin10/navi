import { NextRequest, NextResponse } from 'next/server';
import { ExecuteResponse, ExecutionResult, ClaudeIntentResponse, CreateTaskParams, GetTasksParams, UpdateTaskParams, SendEmailParams, RememberParams, GetWeatherParams, GetNewsParams, AddCalendarEventParams, GetCalendarEventsParams, TimeblockDayParams, CreateNoteParams, GetNotesParams } from '@/lib/types';
import { getCurrentUser, createClient } from '@/lib/auth';
import { getGoogleCalendarToken, getGmailToken, parseTimeToISO } from '@/lib/google-calendar';
import { generateEmailHTML, generateEmailText } from '@/lib/email-template';
import type { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    const body = await request.json();
    const { intent, sessionId, transcript } = body as {
      intent: ClaudeIntentResponse;
      sessionId: string;
      transcript: string;
    };

    if (!intent || !sessionId) {
      return NextResponse.json<ExecuteResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that intent has a proper intent type
    if (!intent.intent) {
      return NextResponse.json<ExecuteResponse>(
        { success: false, error: 'Invalid intent: missing intent type' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Ensure parameters is a valid JSON object (not undefined)
    const safeParameters = intent.parameters ?? {};

    // Create action record in database
    const { data: action, error: actionError } = await (supabase
      .from('actions') as any)
      .insert({
        user_id: user.id,
        session_id: sessionId,
        transcript: transcript || '',
        intent: intent.intent,
        parameters: safeParameters,
        execution_status: 'pending',
        execution_result: null,
      })
      .select()
      .single();

    if (actionError) {
      throw new Error(`Failed to create action record: ${actionError.message || JSON.stringify(actionError)}`);
    }

    if (!action) {
      throw new Error('Failed to create action record: No data returned');
    }

    let result: ExecutionResult;

    // Execute based on intent type
    switch (intent.intent) {
      case 'create_task':
        result = await executeCreateTask(user.id, intent.parameters as CreateTaskParams);
        break;

      case 'get_tasks':
        result = await executeGetTasks(user.id, intent.parameters as GetTasksParams);
        break;

      case 'update_task':
        result = await executeUpdateTask(user.id, intent.parameters as UpdateTaskParams);
        break;

      case 'send_email':
        result = await executeSendEmail(user.id, intent.parameters as SendEmailParams);
        break;

      case 'remember':
        result = await executeRemember(user.id, intent.parameters as RememberParams);
        break;

      case 'get_weather':
        result = await executeGetWeather(user.id, intent.parameters as GetWeatherParams);
        break;

      case 'get_news':
        result = await executeGetNews(user.id, intent.parameters as GetNewsParams);
        break;

      case 'add_calendar_event':
        result = await executeAddCalendarEvent(user.id, intent.parameters as AddCalendarEventParams);
        break;

      case 'get_calendar_events':
        result = await executeGetCalendarEvents(user.id, intent.parameters as GetCalendarEventsParams);
        break;

      case 'timeblock_day':
        result = await executeTimeblockDay(user.id, intent.parameters as TimeblockDayParams);
        break;

      case 'create_note':
        result = await executeCreateNote(user.id, intent.parameters as CreateNoteParams);
        break;

      case 'get_notes':
        result = await executeGetNotes(user.id, intent.parameters as GetNotesParams);
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

    return NextResponse.json<ExecuteResponse>({
      success: true,
      result,
    });
  } catch (error: any) {
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
 * Create a task in Navi AI database
 */
async function executeCreateTask(userId: string, params: CreateTaskParams): Promise<ExecutionResult> {
  try {
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

    return {
      success: true,
      displayResponse: `Task created: "${params.title}"${params.due_date ? ` (Due: ${params.due_date})` : ''}`,
      spokenResponse: `Task created.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create task',
    };
  }
}

/**
 * Get tasks from Navi AI database
 */
async function executeGetTasks(userId: string, params: GetTasksParams): Promise<ExecutionResult> {
  try {
    const supabase = await createClient();

    // Build query based on params
    let query = (supabase
      .from('tasks') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by status (default to 'todo' if not specified)
    const status = params.status || 'todo';
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by priority if specified
    if (params.priority) {
      query = query.eq('priority', params.priority);
    }

    const { data: tasks, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!tasks || tasks.length === 0) {
      const statusText = status === 'all' ? '' : ` with status "${status}"`;
      return {
        success: true,
        response: `You don't have any tasks${statusText}.`,
      };
    }

    // Format tasks for response
    const taskList = tasks.map((task: any) => {
      const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
      const dueText = task.due_date ? ` (Due: ${new Date(task.due_date).toLocaleDateString('en-GB')})` : '';
      return `${priorityEmoji} ${task.title}${dueText}`;
    }).join('\n');

    const statusText = status === 'all' ? '' : ` (${status})`;
    const spokenCount = tasks.length === 1 ? '1 task' : `${tasks.length} tasks`;

    return {
      success: true,
      displayResponse: `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''}${statusText}:\n\n${taskList}`,
      spokenResponse: `You have ${spokenCount}.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get tasks',
    };
  }
}

/**
 * Update a task (e.g., mark as complete)
 */
async function executeUpdateTask(userId: string, params: UpdateTaskParams): Promise<ExecutionResult> {
  try {
    const supabase = await createClient();

    // Find task by fuzzy matching title
    const searchTerm = params.title.toLowerCase();

    const { data: tasks, error: searchError } = await (supabase
      .from('tasks') as any)
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'done'); // Only search non-completed tasks by default

    if (searchError) {
      throw new Error(`Database error: ${searchError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      return {
        success: false,
        error: `No active tasks found. Try checking your completed tasks?`,
      };
    }

    // Find best matching task
    const matchedTask = tasks.find((task: any) =>
      task.title.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(task.title.toLowerCase())
    );

    if (!matchedTask) {
      const taskTitles = tasks.slice(0, 5).map((t: any) => `• ${t.title}`).join('\n');
      return {
        success: false,
        error: `I couldn't find a task matching "${params.title}". Your current tasks:\n${taskTitles}`,
      };
    }

    // Build update object
    const updates: any = {};
    if (params.status) updates.status = params.status;
    if (params.priority) updates.priority = params.priority;

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: 'No updates specified. What would you like to change?',
      };
    }

    // Update the task
    const { error: updateError } = await (supabase
      .from('tasks') as any)
      .update(updates)
      .eq('id', matchedTask.id);

    if (updateError) {
      throw new Error(`Failed to update task: ${updateError.message}`);
    }

    // Build response
    const statusText = params.status === 'done' ? 'completed' :
                       params.status === 'in_progress' ? 'moved to in progress' :
                       params.status === 'todo' ? 'moved to todo' : 'updated';

    return {
      success: true,
      displayResponse: `Task "${matchedTask.title}" ${statusText}`,
      spokenResponse: `Done! Task ${statusText}.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update task',
    };
  }
}

/**
 * Look up email address from knowledge base by name
 */
function lookupEmailFromKnowledgeBase(knowledgeBase: string, name: string): string | null {
  if (!knowledgeBase || !name) return null;

  // Normalize the name for searching
  const searchName = name.toLowerCase().trim();

  // Look for patterns like "John's email is john@example.com" or "John: john@example.com"
  // or "john@example.com" near the name
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const lines = knowledgeBase.split('\n');

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (lineLower.includes(searchName)) {
      const emails = line.match(emailRegex);
      if (emails && emails.length > 0) {
        return emails[0];
      }
    }
  }

  return null;
}

/**
 * Send an email using Gmail API (OAuth)
 */
async function executeSendEmail(userId: string, params: SendEmailParams): Promise<ExecutionResult> {
  try {
    // Get Gmail access token
    const accessToken = await getGmailToken(userId);

    const supabase = await createClient();

    // Get user's profile (email signature and knowledge base for contact lookup)
    const { data: profile } = await (supabase
      .from('user_profiles') as any)
      .select('email_signature, knowledge_base')
      .eq('id', userId)
      .single();

    const emailSignature = profile?.email_signature || '';

    // Check if "to" is an email address or a name
    let recipientEmail = params.to;
    let recipientName = '';
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.to);

    if (!isEmail) {
      // It's a name - look up from knowledge base
      recipientName = params.to;
      const foundEmail = lookupEmailFromKnowledgeBase(profile?.knowledge_base || '', params.to);

      if (!foundEmail) {
        return {
          success: false,
          error: `I couldn't find an email address for "${params.to}" in your knowledge base. Try saying "remember that ${params.to}'s email is..." first.`,
        };
      }

      recipientEmail = foundEmail;
    }

    // Generate email content
    const htmlBody = generateEmailHTML(params.body, emailSignature);
    const textBody = generateEmailText(params.body, emailSignature);

    // Create RFC 822 formatted email (MIME)
    const boundary = `boundary_${Date.now()}`;
    const emailLines = [
      `To: ${recipientEmail}`,
      `Subject: ${params.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      textBody,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      htmlBody,
      '',
      `--${boundary}--`,
    ];

    const rawEmail = emailLines.join('\r\n');
    // Base64 URL-safe encode
    const encodedEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gmail API error: ${error.error?.message || 'Failed to send'}`);
    }

    // Build response - mention name if contact lookup was used
    const recipientDisplay = recipientName ? `${recipientName} (${recipientEmail})` : recipientEmail;

    return {
      success: true,
      displayResponse: `Email sent to ${recipientDisplay}`,
      spokenResponse: `Email sent${recipientName ? ` to ${recipientName}` : ''}.`,
    };
  } catch (error: any) {
    // Provide helpful error message if Gmail not connected
    if (error.message.includes('not connected')) {
      return {
        success: false,
        error: 'Gmail not connected. Please connect Google in Settings → Integrations.',
      };
    }

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

    return {
      success: true,
      response: `Got it! I've added that to your knowledge base under "${params.section}".`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save to knowledge base',
    };
  }
}

/**
 * Get current weather for a location
 */
async function executeGetWeather(userId: string, params: GetWeatherParams): Promise<ExecutionResult> {
  try {
    const supabase = await createClient();

    // Check daily rate limit (100 calls/day to stay within free tier)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await (supabase
      .from('actions') as any)
      .select('*', { count: 'exact', head: true })
      .eq('intent', 'get_weather')
      .gte('created_at', today.toISOString());

    if (count && count >= 100) {
      return {
        success: true,
        response: "I've hit my daily limit for weather checks. Try again tomorrow!",
      };
    }

    // Get user's location from knowledge base if not provided
    let location: string = params.location || '';

    if (!location) {
      const { data: profile } = await (supabase
        .from('user_profiles') as any)
        .select('knowledge_base')
        .eq('id', userId)
        .single();

      // Try to extract location from knowledge base
      const kb = profile?.knowledge_base || '';
      const locationMatch = kb.match(/location|based in|live in|from\s+([A-Za-z\s]+)/i);
      location = locationMatch ? locationMatch[1].trim() : 'London';
    }

    // Call OpenWeatherMap API
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return {
        success: true,
        response: "I'm sorry, I can't check the weather right now. This feature isn't available yet, but it's coming soon!",
      };
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    const weatherResponse = `It's ${Math.round(data.main.temp)}°C in ${data.name} with ${data.weather[0].description}. Feels like ${Math.round(data.main.feels_like)}°C.`;

    return {
      success: true,
      response: weatherResponse,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get weather',
    };
  }
}

/**
 * Get latest news (coming soon - disabled for beta)
 */
async function executeGetNews(userId: string, params: GetNewsParams): Promise<ExecutionResult> {
  return {
    success: true,
    response: "News updates are coming soon! For now, I can help you with weather, tasks, calendar, emails, and notes.",
  };
}

/**
 * Add a single event to Google Calendar
 */
async function executeAddCalendarEvent(userId: string, params: AddCalendarEventParams): Promise<ExecutionResult> {
  try {

    // Get valid access token
    const accessToken = await getGoogleCalendarToken(userId);

    // Parse times to ISO format
    const startDateTime = parseTimeToISO(params.start_time);
    const endDateTime = params.end_time
      ? parseTimeToISO(params.end_time)
      : new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString(); // Default 1 hour duration

    // Create calendar event
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: params.title,
        description: params.description || '',
        location: params.location || '',
        start: {
          dateTime: startDateTime,
          timeZone: 'Europe/London',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Europe/London',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Calendar API error: ${error.error?.message || 'Unknown error'}`);
    }

    const event = await response.json();

    return {
      success: true,
      displayResponse: `Event "${params.title}" added to your calendar at ${params.start_time}${params.end_time ? ` to ${params.end_time}` : ''}`,
      spokenResponse: `Event added to your calendar.`,
    };
  } catch (error: any) {

    // Provide helpful error message if calendar not connected
    if (error.message.includes('No calendar integration found')) {
      return {
        success: false,
        error: 'Google Calendar not connected. Please connect it in Settings → Integrations.',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to add calendar event',
    };
  }
}

/**
 * Get events from Google Calendar
 */
async function executeGetCalendarEvents(userId: string, params: GetCalendarEventsParams): Promise<ExecutionResult> {
  try {

    // Get valid access token
    const accessToken = await getGoogleCalendarToken(userId);

    // Calculate time range
    const now = new Date();
    let timeMin: Date;
    let timeMax: Date;

    if (params.date) {
      // Specific date
      timeMin = new Date(params.date);
      timeMax = new Date(params.date);
      timeMax.setDate(timeMax.getDate() + 1);
    } else {
      // Based on timeframe
      const timeframe = params.timeframe || 'day';
      timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (timeframe) {
        case 'day':
          timeMax = new Date(timeMin);
          timeMax.setDate(timeMax.getDate() + 1);
          break;
        case 'week':
          timeMax = new Date(timeMin);
          timeMax.setDate(timeMax.getDate() + 7);
          break;
        case 'month':
          timeMax = new Date(timeMin);
          timeMax.setMonth(timeMax.getMonth() + 1);
          break;
      }
    }

    // Get events from Google Calendar
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', timeMin.toISOString());
    url.searchParams.append('timeMax', timeMax.toISOString());
    url.searchParams.append('orderBy', 'startTime');
    url.searchParams.append('singleEvents', 'true');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Calendar API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const events = data.items || [];

    if (events.length === 0) {
      return {
        success: true,
        response: 'No events found for this time period.',
      };
    }

    // Filter out events that have already passed (for today view)
    const currentTime = new Date();
    const filteredEvents = events.filter((event: any) => {
      const eventEnd = new Date(event.end?.dateTime || event.end?.date || event.start.dateTime || event.start.date);
      return eventEnd >= currentTime;
    });

    if (filteredEvents.length === 0) {
      return {
        success: true,
        response: 'No upcoming events for this time period.',
      };
    }

    // Format events for display
    const eventList = filteredEvents.map((event: any) => {
      const start = new Date(event.start.dateTime || event.start.date);
      const timeStr = event.start.dateTime
        ? start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : 'All day';
      return `${timeStr}: ${event.summary}`;
    }).join('\n');

    const timeframeStr = params.timeframe === 'week' ? 'this week' :
                         params.timeframe === 'month' ? 'this month' : 'today';

    // Brief spoken response - just the count
    const eventCount = filteredEvents.length;
    const spokenCount = eventCount === 1 ? '1 event' : `${eventCount} events`;

    return {
      success: true,
      displayResponse: `You have ${eventCount} event${eventCount > 1 ? 's' : ''} ${timeframeStr}:\n\n${eventList}`,
      spokenResponse: `You have ${spokenCount} ${timeframeStr}.`,
    };
  } catch (error: any) {

    if (error.message.includes('No calendar integration found')) {
      return {
        success: false,
        error: 'Google Calendar not connected. Please connect it in Settings → Integrations.',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to get calendar events',
    };
  }
}

/**
 * Create multiple calendar events (timeblocking)
 */
async function executeTimeblockDay(userId: string, params: TimeblockDayParams): Promise<ExecutionResult> {
  try {

    // Get valid access token
    const accessToken = await getGoogleCalendarToken(userId);

    // Determine the date
    const targetDate = params.date ? new Date(params.date) : new Date();

    // Create events in batch
    const createdEvents: string[] = [];
    const failedEvents: string[] = [];

    for (const block of params.blocks) {
      try {
        const startDateTime = parseTimeToISO(block.start_time, targetDate);
        const endDateTime = parseTimeToISO(block.end_time, targetDate);

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: block.title,
            description: block.description || '',
            start: {
              dateTime: startDateTime,
              timeZone: 'Europe/London',
            },
            end: {
              dateTime: endDateTime,
              timeZone: 'Europe/London',
            },
          }),
        });

        if (response.ok) {
          createdEvents.push(`${block.start_time}-${block.end_time}: ${block.title}`);
        } else {
          failedEvents.push(block.title);
        }
      } catch (blockError) {
        failedEvents.push(block.title);
      }
    }

    if (createdEvents.length === 0) {
      return {
        success: false,
        error: 'Failed to create any calendar events',
      };
    }

    // Detailed response for display
    let displayResponse = `Created ${createdEvents.length} time block${createdEvents.length > 1 ? 's' : ''} for ${params.date || 'today'}:\n\n${createdEvents.join('\n')}`;

    if (failedEvents.length > 0) {
      displayResponse += `\n\nFailed to create: ${failedEvents.join(', ')}`;
    }

    // Brief response for TTS
    const count = createdEvents.length;
    const spokenResponse = `I've added ${count} time block${count > 1 ? 's' : ''} to your calendar${failedEvents.length > 0 ? `, but ${failedEvents.length} failed` : ''}.`;

    return {
      success: true,
      displayResponse,
      spokenResponse,
    };
  } catch (error: any) {

    if (error.message.includes('No calendar integration found')) {
      return {
        success: false,
        error: 'Google Calendar not connected. Please connect it in Settings → Integrations.',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to create time blocks',
    };
  }
}

/**
 * Create a note in Navi AI database
 */
async function executeCreateNote(userId: string, params: CreateNoteParams): Promise<ExecutionResult> {
  try {

    const supabase = await createClient();

    const { data, error } = await (supabase
      .from('notes') as any)
      .insert({
        user_id: userId,
        title: params.title,
        content: params.content,
        folder: params.folder || '',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const folderText = params.folder ? ` in your ${params.folder} folder` : '';
    return {
      success: true,
      displayResponse: `Note "${params.title}" created${folderText}`,
      spokenResponse: `Note created.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create note',
    };
  }
}

/**
 * Get/search notes from Navi AI database
 */
async function executeGetNotes(userId: string, params: GetNotesParams): Promise<ExecutionResult> {
  try {
    const supabase = await createClient();

    // Get all notes first, then filter
    let query = (supabase
      .from('notes') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by folder if specified
    if (params.folder) {
      query = query.ilike('folder', `%${params.folder}%`);
    }

    const { data: notes, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!notes || notes.length === 0) {
      if (params.folder) {
        return {
          success: true,
          response: `You don't have any notes in the "${params.folder}" folder.`,
        };
      }
      return {
        success: true,
        response: `You don't have any notes yet.`,
      };
    }

    // Filter by search query if specified
    let filteredNotes = notes;
    if (params.query) {
      const searchTerm = params.query.toLowerCase();
      filteredNotes = notes.filter((note: any) =>
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm)
      );
    }

    if (filteredNotes.length === 0) {
      return {
        success: true,
        response: `I couldn't find any notes matching "${params.query}".`,
      };
    }

    // Format notes for display
    const noteList = filteredNotes.slice(0, 10).map((note: any) => {
      const folderTag = note.folder ? ` [${note.folder}]` : '';
      const preview = note.content.length > 100
        ? note.content.substring(0, 100) + '...'
        : note.content;
      return `📝 **${note.title}**${folderTag}\n${preview}`;
    }).join('\n\n');

    const countText = filteredNotes.length === 1 ? '1 note' : `${filteredNotes.length} notes`;
    const queryText = params.query ? ` about "${params.query}"` : '';
    const folderText = params.folder ? ` in ${params.folder}` : '';

    return {
      success: true,
      displayResponse: `Found ${countText}${queryText}${folderText}:\n\n${noteList}`,
      spokenResponse: `You have ${countText}${queryText}${folderText}.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get notes',
    };
  }
}
