'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ExternalLink, Mail, CheckSquare, Volume2 } from 'lucide-react';
import { ExecutionResult } from '@/lib/types';

interface ProofPanelProps {
  result: ExecutionResult;
  audioUrl?: string | null;
  onNewAction: () => void;
}

export default function ProofPanel({ result, audioUrl, onNewAction }: ProofPanelProps) {
  const isSuccess = result.success;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Auto-play voice response when audioUrl is available
    if (audioUrl && audioRef.current) {
      console.log('[ProofPanel] Auto-playing execution result voice');
      audioRef.current.play().catch((error) => {
        console.error('[ProofPanel] Failed to auto-play:', error);
      });
    }
  }, [audioUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className={`
        backdrop-blur-sm rounded-lg p-6 border-2
        ${
          isSuccess
            ? 'bg-green-900/30 border-green-500/50'
            : 'bg-red-900/30 border-red-500/50'
        }
      `}
      >
        {/* Audio element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={() => setIsPlaying(true)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}

        {/* Voice indicator */}
        {audioUrl && (
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
            <p className="text-xs text-gray-400">
              {isPlaying ? 'Playing response...' : 'Voice response ready'}
            </p>
          </div>
        )}

        {/* Status header */}
        <div className="flex items-center gap-3 mb-4">
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          ) : (
            <XCircle className="w-8 h-8 text-red-400" />
          )}
          <h3 className={`text-xl font-semibold ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
            {isSuccess ? 'Action Completed Successfully' : 'Action Failed'}
          </h3>
        </div>

        {/* Success details */}
        {isSuccess && (
          <div className="space-y-3">
            {/* Generic response (calendar, weather, news, remember, etc.) */}
            {/* Use displayResponse for detailed info on screen, fall back to response */}
            {(result.displayResponse || result.response) && (
              <div className="bg-black/30 rounded p-4">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{result.displayResponse || result.response}</p>
              </div>
            )}

            {/* Task created */}
            {result.task_id && result.notion_url && (
              <div className="bg-black/30 rounded p-4">
                <div className="flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-green-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-green-400 font-medium mb-1">Task Created</p>
                    <p className="text-gray-300 text-sm mb-2">Task ID: {result.task_id}</p>
                    <a
                      href={result.notion_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View in Notion
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Email sent */}
            {result.message_id && (
              <div className="bg-black/30 rounded p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-green-400 font-medium mb-1">Email Sent</p>
                    <p className="text-gray-300 text-sm">Message ID: {result.message_id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error details */}
        {!isSuccess && result.error && (
          <div className="bg-black/30 rounded p-4">
            <p className="text-red-400 font-medium mb-1">Error</p>
            <p className="text-gray-300 text-sm">{result.error}</p>
          </div>
        )}

        {/* New action button */}
        <motion.button
          onClick={onNewAction}
          className="w-full mt-6 px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          Start New Action
        </motion.button>
      </div>
    </motion.div>
  );
}
