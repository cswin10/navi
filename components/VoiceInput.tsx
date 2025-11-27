'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  showSuggestions?: boolean;
}

// Voice command suggestions for new users
const VOICE_SUGGESTIONS = [
  { text: 'Hello Navi', icon: '👋', description: 'Start a conversation' },
  { text: 'Add a task to review the project', icon: '📝', description: 'Create tasks' },
  { text: 'What\'s on my calendar today?', icon: '📅', description: 'Check schedule' },
  { text: 'Send an email to John about the meeting', icon: '📧', description: 'Send emails' },
  { text: 'Remember that my meeting is at 3pm', icon: '🧠', description: 'Save info' },
];

export default function VoiceInput({ onTranscript, disabled, showSuggestions = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (disabled || isProcessing) return;

    try {
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
        setIsRecording(false);
        setIsProcessing(true);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Create blob from chunks
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

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
            onTranscript(data.text);
          } else {
            alert(`Transcription failed: ${data.error}`);
          }
        } catch (error) {
          alert('Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      alert('Failed to access microphone. Please check permissions.');
    }
  }, [disabled, isProcessing, onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        onClick={handleClick}
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
            Listening... Click to stop
          </motion.p>
        )}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Spinner */}
            <motion.div
              className="w-6 h-6 rounded-full border-2 border-blue-500/30"
              style={{ borderTopColor: 'rgb(59, 130, 246)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-blue-400 font-medium">
              Transcribing...
            </p>
          </motion.div>
        )}
        {!isRecording && !isProcessing && (
          <p className="text-gray-400">Click to start speaking</p>
        )}
      </div>

      {/* Voice Suggestions */}
      {showSuggestions && !isRecording && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md mt-8"
        >
          <p className="text-sm text-gray-500 text-center mb-3">Try saying:</p>
          <div className="space-y-2">
            {VOICE_SUGGESTIONS.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors"
              >
                <span className="text-lg">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">"{suggestion.text}"</p>
                </div>
                <span className="text-xs text-slate-500 hidden sm:block">{suggestion.description}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
