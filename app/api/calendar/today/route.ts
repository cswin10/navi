import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGoogleCalendarToken } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get valid access token
    let accessToken: string;
    try {
      accessToken = await getGoogleCalendarToken(user.id);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Calendar not connected', events: [] },
        { status: 200 }
      );
    }

    // Get today's events
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', startOfDay.toISOString());
    url.searchParams.append('timeMax', endOfDay.toISOString());
    url.searchParams.append('orderBy', 'startTime');
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('maxResults', '10');

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

    // Filter out past events and only include future ones from now
    const upcomingEvents = events.filter((event: any) => {
      if (event.start.dateTime) {
        const eventStart = new Date(event.start.dateTime);
        return eventStart >= now;
      }
      // All-day events are always included for today
      return true;
    });

    return NextResponse.json({
      success: true,
      events: upcomingEvents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch calendar events', events: [] },
      { status: 200 }
    );
  }
}
