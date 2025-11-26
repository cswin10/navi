import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createClient } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    const supabase = await createClient();

    // Collect all user data
    const exportData: Record<string, any> = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
    };

    // 1. User Profile
    const { data: profile } = await (supabase.from('user_profiles') as any)
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      exportData.profile = {
        name: profile.name,
        email: profile.email,
        knowledgeBase: profile.knowledge_base,
        emailSignature: profile.email_signature,
        contextMemory: profile.context_memory,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    }

    // 2. Tasks
    const { data: tasks } = await (supabase.from('tasks') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    exportData.tasks = tasks?.map((task: any) => ({
      title: task.title,
      notes: task.notes,
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date,
      createdAt: task.created_at,
    })) || [];

    // 3. Notes
    const { data: notes } = await (supabase.from('notes') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    exportData.notes = notes?.map((note: any) => ({
      title: note.title,
      content: note.content,
      folder: note.folder,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })) || [];

    // 4. Actions (voice command history)
    const { data: actions } = await (supabase.from('actions') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to last 1000 actions

    exportData.actionHistory = actions?.map((action: any) => ({
      transcript: action.transcript,
      intent: action.intent,
      parameters: action.parameters,
      status: action.execution_status,
      result: action.execution_result,
      createdAt: action.created_at,
    })) || [];

    // 5. Integrations (without sensitive tokens)
    const { data: integrations } = await (supabase.from('integrations') as any)
      .select('provider, scopes, created_at, updated_at')
      .eq('user_id', user.id);

    exportData.integrations = integrations?.map((integration: any) => ({
      provider: integration.provider,
      scopes: integration.scopes,
      connectedAt: integration.created_at,
      updatedAt: integration.updated_at,
    })) || [];

    // 6. Sessions
    const { data: sessions } = await (supabase.from('sessions') as any)
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    exportData.sessions = sessions?.map((session: any) => ({
      sessionId: session.id,
      createdAt: session.created_at,
    })) || [];

    // Return as downloadable JSON file
    const jsonString = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="navi-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Data export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export data',
      },
      { status: 500 }
    );
  }
}
