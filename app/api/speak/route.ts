import { NextRequest, NextResponse } from 'next/server';
import { TTSResponse } from '@/lib/types';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Rachel - clear, professional voice
// Alternative: '21m00Tcm4TlvDq8ikWAM' for Rachel or 'pNInz6obpgDQGcFmaJgB' for Adam

export async function POST(request: NextRequest) {
  console.log('[Speak API] Starting TTS request...');

  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      console.error('[Speak API] No text provided');
      return NextResponse.json<TTSResponse>(
        { success: false, error: 'No text provided' },
        { status: 400 }
      );
    }

    console.log('[Speak API] Converting text to speech:', text);

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
          text,
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
      console.error('[Speak API] ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    console.log('[Speak API] TTS successful, converting to base64...');

    // Convert audio to base64 for client
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    console.log('[Speak API] Audio ready, size:', audioBuffer.byteLength, 'bytes');

    return NextResponse.json<TTSResponse>({
      success: true,
      audioUrl,
    });
  } catch (error: any) {
    console.error('[Speak API] Error:', error);
    return NextResponse.json<TTSResponse>(
      {
        success: false,
        error: error.message || 'Failed to generate speech',
      },
      { status: 500 }
    );
  }
}
