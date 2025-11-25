import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TranscriptionResponse } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';

// Lazy initialize OpenAI client
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json<TranscriptionResponse>(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OpenAI API
    const buffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(buffer);

    // Create a File-like object for OpenAI
    const file = new File([audioBuffer], 'audio.webm', { type: audioFile.type });

    // Call Whisper API
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    return NextResponse.json<TranscriptionResponse>({
      success: true,
      text: transcription.text,
    });
  } catch (error: any) {
    return NextResponse.json<TranscriptionResponse>(
      {
        success: false,
        error: error.message || 'Failed to transcribe audio',
      },
      { status: 500 }
    );
  }
}
