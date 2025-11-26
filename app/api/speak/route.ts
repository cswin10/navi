import { NextRequest, NextResponse } from 'next/server';
import { TTSResponse } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';
import { formatForTTS } from '@/lib/tts-formatter';
import { checkRateLimit, RATE_LIMITS } from '@/lib/api-utils';

// ElevenLabs TTS configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// ElevenLabs voice IDs - British female voices
// Charlotte: XB0fDUnXU5powFXDhCwa (British, warm)
// Alice: Xb7hH8MSUJpSbSDYk0k2 (British, confident)
// Lily: pFZP5JQG7iQjIQuC4Bku (British, warm, narrative)
const VOICE_ID = 'pFZP5JQG7iQjIQuC4Bku'; // Lily - British female

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.speak);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Verify authentication
    const user = await getCurrentUser();

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json<TTSResponse>(
        { success: false, error: 'No text provided' },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json<TTSResponse>(
        { success: false, error: 'TTS not configured' },
        { status: 500 }
      );
    }

    // Format text for more natural TTS
    const formattedText = formatForTTS(text);

    // Call ElevenLabs TTS API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: formattedText,
        model_id: 'eleven_turbo_v2_5', // Fast, low latency
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0, // 0 = faster
          use_speaker_boost: true,
        },
        speed: 1.15, // Slightly faster speech (1.0 is normal, range 0.25-4.0)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs TTS error: ${response.status} - ${errorData.detail?.message || JSON.stringify(errorData) || 'Unknown error'}`);
    }

    // Convert audio to base64 for client
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json<TTSResponse>({
      success: true,
      audioUrl,
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json<TTSResponse>(
      {
        success: false,
        error: error.message || 'Failed to generate speech',
      },
      { status: 500 }
    );
  }
}
