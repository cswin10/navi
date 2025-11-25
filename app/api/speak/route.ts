import { NextRequest, NextResponse } from 'next/server';
import { TTSResponse } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';
import { formatForTTS } from '@/lib/tts-formatter';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Rachel - clear, professional voice
// Alternative: '21m00Tcm4TlvDq8ikWAM' for Rachel or 'pNInz6obpgDQGcFmaJgB' for Adam

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

    // Format text for more natural TTS
    const formattedText = formatForTTS(text);

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: formattedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
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
    return NextResponse.json<TTSResponse>(
      {
        success: false,
        error: error.message || 'Failed to generate speech',
      },
      { status: 500 }
    );
  }
}
