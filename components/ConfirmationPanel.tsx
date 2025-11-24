'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Volume2, Loader2 } from 'lucide-react';
import { ClaudeIntentResponse } from '@/lib/types';

interface ConfirmationPanelProps {
  intent: ClaudeIntentResponse;
  intents?: ClaudeIntentResponse[]; // Multiple intents
  audioUrl: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export default function ConfirmationPanel({
  intent,
  intents,
  audioUrl,
  onConfirm,
  onCancel,
  isExecuting = false,
}: ConfirmationPanelProps) {
  // Use multiple intents if available
  const hasMultiple = intents && intents.length > 1;
  const displayIntents = hasMultiple ? intents : [intent];
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
      <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-blue-700/50">
        {/* Voice indicator */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Volume2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isPlaying ? 'text-blue-400 animate-pulse' : 'text-gray-400'}`} />
          <p className="text-xs sm:text-sm text-gray-400">
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
        <div className="mb-4 sm:mb-6">
          <p className="text-white text-base sm:text-lg leading-relaxed">
            {hasMultiple
              ? `I'll perform ${displayIntents.length} actions:`
              : intent.response}
          </p>
        </div>

        {/* Display all intents */}
        {displayIntents.map((singleIntent, index) => (
          <div key={index} className="bg-black/30 rounded p-3 sm:p-4 mb-3 sm:mb-4">
            {hasMultiple && (
              <p className="text-xs sm:text-sm font-medium text-blue-400 mb-2">
                Action {index + 1}: {singleIntent.intent.replace(/_/g, ' ')}
              </p>
            )}
            {!hasMultiple && (
              <p className="text-xs sm:text-sm text-gray-400 mb-2">Details:</p>
            )}
            <div className="space-y-1">
              {Object.entries(singleIntent.parameters).map(([key, value]) => {
                // Format value based on type
                let displayValue: string;

                if (Array.isArray(value)) {
                  // Handle arrays (like timeblock blocks)
                  if (key === 'blocks' && value.length > 0) {
                    displayValue = value.map((block: any) =>
                      `${block.start_time}-${block.end_time}: ${block.title}`
                    ).join('\n');
                  } else {
                    displayValue = value.join(', ');
                  }
                } else if (typeof value === 'object' && value !== null) {
                  // Handle objects
                  displayValue = JSON.stringify(value, null, 2);
                } else {
                  // Handle primitives
                  displayValue = value?.toString() || 'N/A';
                }

                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:gap-2 text-xs sm:text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-300 whitespace-pre-wrap break-words">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex gap-2 sm:gap-4">
          <motion.button
            onClick={onConfirm}
            disabled={isExecuting}
            className={`
              flex-1 flex items-center justify-center gap-1.5 sm:gap-2
              px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base
              ${
                isExecuting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              }
              text-white transition-colors
            `}
            whileTap={!isExecuting ? { scale: 0.98 } : {}}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="hidden sm:inline">Executing...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                Confirm
              </>
            )}
          </motion.button>

          <motion.button
            onClick={onCancel}
            disabled={isExecuting}
            className={`
              flex-1 flex items-center justify-center gap-1.5 sm:gap-2
              px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base
              ${
                isExecuting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
              }
              text-white transition-colors
            `}
            whileTap={!isExecuting ? { scale: 0.98 } : {}}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            Cancel
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
