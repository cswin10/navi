'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Volume2, Loader2 } from 'lucide-react';
import { ClaudeIntentResponse } from '@/lib/types';

interface ConfirmationPanelProps {
  intent: ClaudeIntentResponse;
  audioUrl: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export default function ConfirmationPanel({
  intent,
  audioUrl,
  onConfirm,
  onCancel,
  isExecuting = false,
}: ConfirmationPanelProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Auto-play voice response when audioUrl is available
    if (audioUrl && audioRef.current) {
      console.log('[ConfirmationPanel] Auto-playing voice response');
      audioRef.current.play().catch((error) => {
        console.error('[ConfirmationPanel] Failed to auto-play:', error);
      });
    }
  }, [audioUrl]);

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-lg p-6 border border-blue-700/50">
        {/* Voice indicator */}
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className={`w-5 h-5 ${isPlaying ? 'text-blue-400 animate-pulse' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-400">
            {isPlaying ? 'Playing...' : audioUrl ? 'Voice response ready' : 'Generating voice...'}
          </p>
        </div>

        {/* Audio element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={handleAudioPlay}
            onEnded={handleAudioEnded}
            className="hidden"
          />
        )}

        {/* Intent response */}
        <div className="mb-6">
          <p className="text-white text-lg leading-relaxed">{intent.response}</p>
        </div>

        {/* Parameters display */}
        <div className="bg-black/30 rounded p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">Details:</p>
          <div className="space-y-1">
            {Object.entries(intent.parameters).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-sm">
                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="text-gray-300">{value?.toString() || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <motion.button
            onClick={onConfirm}
            disabled={isExecuting}
            className={`
              flex-1 flex items-center justify-center gap-2
              px-6 py-3 rounded-lg font-medium
              ${
                isExecuting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }
              text-white transition-colors
            `}
            whileTap={!isExecuting ? { scale: 0.98 } : {}}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirm
              </>
            )}
          </motion.button>

          <motion.button
            onClick={onCancel}
            disabled={isExecuting}
            className={`
              flex-1 flex items-center justify-center gap-2
              px-6 py-3 rounded-lg font-medium
              ${
                isExecuting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }
              text-white transition-colors
            `}
            whileTap={!isExecuting ? { scale: 0.98 } : {}}
          >
            <X className="w-5 h-5" />
            Cancel
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
