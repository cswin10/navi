import { createClient } from './auth';
import { decrypt, encrypt } from './encryption';

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Get valid Google Calendar access token (refreshes if expired)
 */
export async function getGoogleCalendarToken(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: integration } = await (supabase
    .from('user_integrations') as any)
    .select('credentials')
    .eq('user_id', userId)
    .eq('integration_type', 'google_calendar')
    .eq('is_active', true)
    .single();

  if (!integration) {
    throw new Error('Google Calendar not connected. Please connect in Settings → Integrations.');
  }

  const credentials = integration.credentials as GoogleTokens;

  // Check if token is expired (with 5 minute buffer)
  if (credentials.expires_at < Date.now() + (5 * 60 * 1000)) {
    // Token expired, refresh it
    const decryptedRefreshToken = decrypt(credentials.refresh_token);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: decryptedRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google token');
    }

    const newTokens = await response.json();

    // Update stored credentials
    await (supabase
      .from('user_integrations') as any)
      .update({
        credentials: {
          ...credentials,
          access_token: newTokens.access_token,
          expires_at: Date.now() + (newTokens.expires_in * 1000),
        },
      })
      .eq('user_id', userId)
      .eq('integration_type', 'google_calendar');

    return newTokens.access_token;
  }

  return credentials.access_token;
}

/**
 * Parse natural language time to ISO datetime
 */
export function parseTimeToISO(timeStr: string, date?: Date): string {
  const baseDate = date || new Date();

  // Handle common formats: "9am", "14:00", "2:30pm"
  const time24Match = timeStr.match(/^(\d{1,2}):?(\d{2})$/);
  const time12Match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);

  let hours: number;
  let minutes: number;

  if (time24Match) {
    hours = parseInt(time24Match[1]);
    minutes = parseInt(time24Match[2] || '0');
  } else if (time12Match) {
    hours = parseInt(time12Match[1]);
    minutes = parseInt(time12Match[2] || '0');
    const period = time12Match[3].toLowerCase();

    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
  } else {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);

  return result.toISOString();
}
