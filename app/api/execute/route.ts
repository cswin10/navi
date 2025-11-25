import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ExecuteResponse, ExecutionResult, ClaudeIntentResponse, CreateTaskParams, SendEmailParams, RememberParams, GetWeatherParams, GetNewsParams, AddCalendarEventParams, GetCalendarEventsParams, TimeblockDayParams, CreateNoteParams } from '@/lib/types';
import { getCurrentUser, createClient } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import { getGoogleCalendarToken, parseTimeToISO } from '@/lib/google-calendar';
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
 * Send an email using user's connected email account
 */
async function executeSendEmail(userId: string, params: SendEmailParams): Promise<ExecutionResult> {
  try {

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

    // Get user's email signature from profile
    const { data: profile } = await (supabase
      .from('user_profiles') as any)
      .select('email_signature')
      .eq('id', userId)
      .single();

    const emailSignature = profile?.email_signature || '';

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

    // Generate HTML and plain text versions
    const htmlBody = generateEmailHTML(params.body, emailSignature);
    const textBody = generateEmailText(params.body, emailSignature);

    // Send email with HTML and plain text versions
    const info = await transporter.sendMail({
      from: credentials.email,
      to: params.to,
      subject: params.subject,
      text: textBody,
      html: htmlBody,
    });

    return {
      success: true,
      response: `Email sent successfully to ${params.to}`,
    };
  } catch (error: any) {
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

    // Get user's location from knowledge base if not provided
    let location: string = params.location || '';

    if (!location) {
      const supabase = await createClient();
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
      throw new Error('Weather API key not configured');
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
 * Get latest news
 */
async function executeGetNews(userId: string, params: GetNewsParams): Promise<ExecutionResult> {
  try {

    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      throw new Error('News API key not configured');
    }

    // Build query
    const topic = params.topic || 'general';
    const query = topic === 'general' ? 'top-headlines?country=gb' : `everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt`;

    const response = await fetch(
      `https://newsapi.org/v2/${query}&pageSize=3&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      return {
        success: true,
        response: `No news found for "${topic}". Try a different topic.`,
      };
    }

    // Format top 3 articles
    const articles = data.articles.slice(0, 3);
    const newsResponse = `Here are the top stories${topic !== 'general' ? ` about ${topic}` : ''}:\n\n` +
      articles.map((article: any, i: number) => `${i + 1}. ${article.title} - ${article.source.name}`).join('\n');

    return {
      success: true,
      response: newsResponse,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get news',
    };
  }
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

    // Format events for response
    const eventList = events.map((event: any) => {
      const start = new Date(event.start.dateTime || event.start.date);
      const timeStr = event.start.dateTime
        ? start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : 'All day';
      return `${timeStr}: ${event.summary}`;
    }).join('\n');

    const timeframeStr = params.timeframe === 'week' ? 'this week' :
                         params.timeframe === 'month' ? 'this month' : 'today';

    return {
      success: true,
      response: `You have ${events.length} event${events.length > 1 ? 's' : ''} ${timeframeStr}:\n\n${eventList}`,
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
