import { NextRequest, NextResponse } from 'next/server';
import { TTSResponse } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';
import { formatForTTS } from '@/lib/tts-formatter';

// OpenAI TTS configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Available voices: alloy, echo, fable, onyx, nova, shimmer
// - nova: female, warm (American)
// - shimmer: female, expressive (American)
// - fable: British accent (neutral/narrative style)
// - alloy: neutral
const VOICE = 'shimmer'; // Female, expressive

export async function POST(request: NextRequest) {
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

    if (!OPENAI_API_KEY) {
      return NextResponse.json<TTSResponse>(
        { success: false, error: 'TTS not configured' },
        { status: 500 }
      );
    }

    // Format text for more natural TTS
    const formattedText = formatForTTS(text);

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // Use tts-1 for speed/cost, tts-1-hd for quality
        input: formattedText,
        voice: VOICE,
        response_format: 'mp3',
        speed: 1.15, // Slightly faster for snappier responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI TTS error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
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
