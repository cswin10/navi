'use client';

// Navi V1 MVP - Voice-first AI Personal Operator
import { useState, useEffect } from 'react';
import VoiceInput from '@/components/VoiceInput';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import ConfirmationPanel from '@/components/ConfirmationPanel';
import ProofPanel from '@/components/ProofPanel';
import { AppState, ActionState } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>({
    transcript: '',
    intent: null,
    audioUrl: null,
    executionResult: null,
    error: null,
  });

  // Initialize session
  useEffect(() => {
    async function initSession() {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .insert({ user_id: null })
          .select()
          .single();

        if (error) throw error;

        setSessionId(data.id);
        console.log('[App] Session created:', data.id);
      } catch (error) {
        console.error('[App] Failed to create session:', error);
      }
    }

    initSession();
  }, []);

  const handleTranscript = async (text: string) => {
    console.log('[App] Transcript received:', text);
    setActionState((prev) => ({ ...prev, transcript: text }));
    setAppState('processing');

    try {
      // Process intent with Claude
      const processResponse = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const processData = await processResponse.json();

      if (!processData.success || !processData.intent) {
        throw new Error(processData.error || 'Failed to process intent');
      }

      console.log('[App] Intent processed:', processData.intent);

      // Generate voice response
      const speakResponse = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: processData.intent.response }),
      });

      const speakData = await speakResponse.json();

      if (!speakData.success) {
        console.error('[App] TTS failed:', speakData.error);
      }

      setActionState((prev) => ({
        ...prev,
        intent: processData.intent,
        audioUrl: speakData.audioUrl || null,
      }));

      setAppState('confirming');
    } catch (error: any) {
      console.error('[App] Error processing:', error);
      setActionState((prev) => ({
        ...prev,
        error: error.message,
      }));
      setAppState('error');
    }
  };

  const handleConfirm = async () => {
    if (!actionState.intent || !sessionId) {
      console.error('[App] Missing intent or session');
      return;
    }

    console.log('[App] Executing action...');
    setAppState('executing');

    try {
      const executeResponse = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: actionState.intent,
          sessionId,
          transcript: actionState.transcript,
        }),
      });

      const executeData = await executeResponse.json();

      if (!executeData.success || !executeData.result) {
        throw new Error(executeData.error || 'Failed to execute action');
      }

      console.log('[App] Execution complete:', executeData.result);

      setActionState((prev) => ({
        ...prev,
        executionResult: executeData.result,
      }));

      setAppState('completed');
    } catch (error: any) {
      console.error('[App] Execution error:', error);
      setActionState((prev) => ({
        ...prev,
        error: error.message,
        executionResult: {
          success: false,
          error: error.message,
        },
      }));
      setAppState('completed');
    }
  };

  const handleCancel = () => {
    console.log('[App] Action cancelled');
    resetState();
  };

  const handleNewAction = () => {
    console.log('[App] Starting new action');
    resetState();
  };

  const resetState = () => {
    setActionState({
      transcript: '',
      intent: null,
      audioUrl: null,
      executionResult: null,
      error: null,
    });
    setAppState('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-blue-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Navi
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Your Voice-First AI Personal Operator</p>
          {sessionId && (
            <p className="text-gray-600 text-xs mt-2">Session: {sessionId.slice(0, 8)}...</p>
          )}
        </motion.div>

        {/* Main content area */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Voice Input - Always visible */}
          <div className="flex justify-center">
            <VoiceInput
              onTranscript={handleTranscript}
              disabled={appState !== 'idle'}
            />
          </div>

          {/* Status indicator */}
          <AnimatePresence mode="wait">
            {appState === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-full border border-blue-500/50">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <p className="text-blue-400 text-sm">Processing your request...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript Display */}
          {actionState.transcript && (
            <TranscriptDisplay text={actionState.transcript} />
          )}

          {/* Confirmation Panel */}
          {appState === 'confirming' && actionState.intent && (
            <ConfirmationPanel
              intent={actionState.intent}
              audioUrl={actionState.audioUrl}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}

          {/* Executing state */}
          {appState === 'executing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 rounded-full border border-green-500/50">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-green-400 text-sm">Executing action...</p>
              </div>
            </motion.div>
          )}

          {/* Proof Panel */}
          {appState === 'completed' && actionState.executionResult && (
            <ProofPanel
              result={actionState.executionResult}
              onNewAction={handleNewAction}
            />
          )}

          {/* Error state */}
          {appState === 'error' && actionState.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="inline-block px-6 py-4 bg-red-600/20 rounded-lg border border-red-500/50">
                <p className="text-red-400 font-medium mb-2">Error</p>
                <p className="text-gray-300 text-sm mb-4">{actionState.error}</p>
                <button
                  onClick={resetState}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 text-gray-600 text-sm"
        >
          <p>Press and hold the button to speak your command</p>
          <p className="mt-1">Powered by OpenAI Whisper • Anthropic Claude • ElevenLabs</p>
        </motion.div>
      </div>
    </div>
  );
}
