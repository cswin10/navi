import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createClient } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=access_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const user = await getCurrentUser();
    const supabase = await createClient();

    // Encrypt the refresh token
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    // Store credentials for both calendar and gmail integrations
    const credentialsData = {
      access_token: tokens.access_token,
      refresh_token: encryptedRefreshToken,
      expires_at: Date.now() + (tokens.expires_in * 1000),
    };

    // Upsert Google Calendar integration
    const { data: existingCalendar } = await (supabase
      .from('user_integrations') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('integration_type', 'google_calendar')
      .maybeSingle();

    if (existingCalendar) {
      await (supabase
        .from('user_integrations') as any)
        .update({ credentials: credentialsData, is_active: true })
        .eq('id', existingCalendar.id);
    } else {
      await (supabase
        .from('user_integrations') as any)
        .insert({
          user_id: user.id,
          integration_type: 'google_calendar',
          credentials: credentialsData,
          is_active: true,
        });
    }

    // Upsert Gmail integration (uses same OAuth tokens)
    const { data: existingGmail } = await (supabase
      .from('user_integrations') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('integration_type', 'google_gmail')
      .maybeSingle();

    if (existingGmail) {
      await (supabase
        .from('user_integrations') as any)
        .update({ credentials: credentialsData, is_active: true })
        .eq('id', existingGmail.id);
    } else {
      await (supabase
        .from('user_integrations') as any)
        .insert({
          user_id: user.id,
          integration_type: 'google_gmail',
          credentials: credentialsData,
          is_active: true,
        });
    }

    // Delete old SMTP email integration if exists (replaced by Gmail OAuth)
    await (supabase
      .from('user_integrations') as any)
      .delete()
      .eq('user_id', user.id)
      .eq('integration_type', 'email');

    // Redirect back to integrations page with success
    return NextResponse.redirect(new URL('/dashboard/integrations?success=google_connected', request.url));
  } catch (error: any) {
    return NextResponse.redirect(new URL('/dashboard/integrations?error=connection_failed', request.url));
  }
}
