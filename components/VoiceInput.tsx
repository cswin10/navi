'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (disabled || isProcessing) return;

    try {
      console.log('[VoiceInput] Starting recording...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to use the most compatible audio format
      let mimeType = 'audio/webm';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log('[VoiceInput] Using mime type:', mimeType);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('[VoiceInput] Recording stopped, processing...');
        setIsRecording(false);
        setIsProcessing(true);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Create blob from chunks
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('[VoiceInput] Audio blob size:', audioBlob.size);

        // Send to transcription API
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (data.success && data.text) {
            console.log('[VoiceInput] Transcription:', data.text);
            onTranscript(data.text);
          } else {
            console.error('[VoiceInput] Transcription failed:', data.error);
            alert(`Transcription failed: ${data.error}`);
          }
        } catch (error) {
          console.error('[VoiceInput] Error:', error);
          alert('Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      console.log('[VoiceInput] Recording started');
    } catch (error) {
      console.error('[VoiceInput] Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  }, [disabled, isProcessing, onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('[VoiceInput] Stopping recording...');
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleMouseDown = () => {
    startRecording();
  };

  const handleMouseUp = () => {
    stopRecording();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopRecording();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled || isProcessing}
        className={`
          relative w-32 h-32 rounded-full
          flex items-center justify-center
          transition-all duration-200
          ${
            isRecording
              ? 'bg-red-500 shadow-lg shadow-red-500/50'
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/50'
          }
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          select-none
        `}
        whileTap={{ scale: 0.95 }}
        animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
      >
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-400 opacity-75"
            animate={{ scale: [1, 1.2, 1], opacity: [0.75, 0.3, 0.75] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        <div className="relative z-10">
          {isRecording ? (
            <MicOff className="w-12 h-12 text-white" />
          ) : (
            <Mic className="w-12 h-12 text-white" />
          )}
        </div>
      </motion.button>

      <div className="text-center">
        {isRecording && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 font-medium"
          >
            Recording... Release to stop
          </motion.p>
        )}
        {isProcessing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-400 font-medium"
          >
            Transcribing...
          </motion.p>
        )}
        {!isRecording && !isProcessing && (
          <p className="text-gray-400">Press and hold to speak</p>
        )}
      </div>
    </div>
  );
}
