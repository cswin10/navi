import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ExecuteResponse, ExecutionResult, ClaudeIntentResponse, CreateTaskParams, SendEmailParams, RememberParams, GetWeatherParams, GetNewsParams } from '@/lib/types';
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

      case 'get_weather':
        result = await executeGetWeather(user.id, intent.parameters as GetWeatherParams);
        break;

      case 'get_news':
        result = await executeGetNews(user.id, intent.parameters as GetNewsParams);
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

/**
 * Get current weather for a location
 */
async function executeGetWeather(userId: string, params: GetWeatherParams): Promise<ExecutionResult> {
  try {
    console.log('[Execute] Getting weather:', params);

    // Get user's location from knowledge base if not provided
    let location = params.location;

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

    console.log('[Execute] Weather fetched successfully');

    return {
      success: true,
      response: weatherResponse,
    };
  } catch (error: any) {
    console.error('[Execute] Weather fetch failed:', error);
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
    console.log('[Execute] Getting news:', params);

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

    console.log('[Execute] News fetched successfully');

    return {
      success: true,
      response: newsResponse,
    };
  } catch (error: any) {
    console.error('[Execute] News fetch failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to get news',
    };
  }
}
