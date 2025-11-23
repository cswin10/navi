import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TranscriptionResponse } from '@/lib/types';

// Lazy initialize OpenAI client
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  console.log('[Transcribe API] Starting transcription request...');

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('[Transcribe API] No audio file provided');
      return NextResponse.json<TranscriptionResponse>(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('[Transcribe API] Audio file received:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    });

    // Convert File to Buffer for OpenAI API
    const buffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(buffer);

    // Create a File-like object for OpenAI
    const file = new File([audioBuffer], 'audio.webm', { type: audioFile.type });

    console.log('[Transcribe API] Sending to Whisper API...');

    // Call Whisper API
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    console.log('[Transcribe API] Transcription successful:', transcription.text);

    return NextResponse.json<TranscriptionResponse>({
      success: true,
      text: transcription.text,
    });
  } catch (error: any) {
    console.error('[Transcribe API] Error:', error);
    return NextResponse.json<TranscriptionResponse>(
      {
        success: false,
        error: error.message || 'Failed to transcribe audio',
      },
      { status: 500 }
    );
  }
}
