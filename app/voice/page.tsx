'use client';

// Navi AI - Voice-first AI Personal Operating System
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VoiceInput from '@/components/VoiceInput';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import ConfirmationPanel from '@/components/ConfirmationPanel';
import ProofPanel from '@/components/ProofPanel';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { AppState, ActionState, ClaudeIntentResponse } from '@/lib/types';
import { createClient } from '@/lib/supabase-browser';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function VoicePage() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>({
    transcript: '',
    intent: null,
    audioUrl: null,
    executionResult: null,
    error: null,
  });

  // Initialize user and session
  useEffect(() => {
    async function initUserAndSession() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('[App] Not authenticated');
          router.push('/login');
          return;
        }

        setUserId(user.id);
        console.log('[App] User authenticated:', user.id);

        // Create session for this user
        const { data, error } = await (supabase
          .from('sessions') as any)
          .insert({ user_id: user.id })
          .select()
          .single();

        if (error) throw error;

        setSessionId(data.id);
        console.log('[App] Session created:', data.id);
      } catch (error) {
        console.error('[App] Failed to initialize:', error);
      }
    }

    initUserAndSession();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Force a full page refresh to clear all state
    window.location.href = '/login';
  };

  const cleanStopPhrases = (text: string): string => {
    const stopPhrases = [
      'thank you navi',
      'thanks navi',
      'that\'s all',
      'that is all',
      'stop',
      'done',
      'finish',
    ];

    let cleaned = text.toLowerCase().trim();

    // Check if any stop phrase is at the end
    for (const phrase of stopPhrases) {
      if (cleaned.endsWith(phrase)) {
        // Remove the stop phrase and trim again
        cleaned = cleaned.slice(0, -phrase.length).trim();
        // Remove trailing punctuation
        cleaned = cleaned.replace(/[.,!?]+$/, '').trim();
        console.log('[App] Removed stop phrase:', phrase);
        break;
      }
    }

    return cleaned;
  };

  const handleTranscript = async (text: string) => {
    console.log('[App] Transcript received:', text);

    // Clean stop phrases from the end of the transcript
    const cleanedText = cleanStopPhrases(text);
    console.log('[App] Cleaned transcript:', cleanedText);

    setActionState((prev) => ({ ...prev, transcript: cleanedText }));
    setAppState('processing');

    try {
      // Process intent with Claude (include sessionId for memory)
      const processResponse = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedText, sessionId }),
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

      // Handle different intent types
      if (processData.intent.intent === 'other') {
        // Conversational: Store and go back to idle
        if (sessionId) {
          try {
            const response = await fetch('/api/store-conversation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                transcript: cleanedText,
                intent: processData.intent,
              }),
            });
            console.log('[App] Conversation stored');
          } catch (error) {
            console.error('[App] Failed to store conversation:', error);
          }
        }
        setAppState('idle');
      } else if (['remember', 'get_weather', 'get_news', 'get_calendar_events'].includes(processData.intent.intent)) {
        // Auto-execute: remember, weather, news, get calendar (no confirmation needed)
        await handleConfirm(processData.intent);
      } else {
        // Actions (create_task, send_email, add_calendar_event, timeblock_day): Require confirmation
        setAppState('confirming');
      }
    } catch (error: any) {
      console.error('[App] Error processing:', error);
      setActionState((prev) => ({
        ...prev,
        error: error.message,
      }));
      setAppState('error');
    }
  };

  const handleConfirm = async (intentOverride?: ClaudeIntentResponse) => {
    const intent = intentOverride || actionState.intent;

    if (!intent || !sessionId) {
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
          intent: intent,
          sessionId,
          transcript: actionState.transcript,
        }),
      });

      const executeData = await executeResponse.json();

      if (!executeData.success || !executeData.result) {
        throw new Error(executeData.error || 'Failed to execute action');
      }

      console.log('[App] Execution complete:', executeData.result);

      // Generate TTS for the execution result
      if (executeData.result.response) {
        try {
          const speakResponse = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: executeData.result.response }),
          });

          const speakData = await speakResponse.json();

          if (speakData.success && speakData.audioUrl) {
            setActionState((prev) => ({
              ...prev,
              executionResult: executeData.result,
              audioUrl: speakData.audioUrl,
            }));
          } else {
            setActionState((prev) => ({
              ...prev,
              executionResult: executeData.result,
            }));
          }
        } catch (speakError) {
          console.error('[App] TTS generation failed:', speakError);
          setActionState((prev) => ({
            ...prev,
            executionResult: executeData.result,
          }));
        }
      } else {
        setActionState((prev) => ({
          ...prev,
          executionResult: executeData.result,
        }));
      }

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
      {/* Top Navigation */}
      <div className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Navi AI" className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Navi AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Voice Assistant</h1>
          <p className="text-gray-400 text-lg">Speak your command to get started</p>
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

          {/* Conversational Response (for "other" intents) */}
          {appState === 'idle' && actionState.intent && actionState.intent.intent === 'other' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-lg p-6 border border-purple-700/50">
                <div className="mb-4">
                  <p className="text-white text-lg leading-relaxed">{actionState.intent.response}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p>Ready for your next request...</p>
                </div>
                {actionState.audioUrl && (
                  <audio
                    src={actionState.audioUrl}
                    autoPlay
                    className="hidden"
                  />
                )}
              </div>
            </motion.div>
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
              audioUrl={actionState.audioUrl}
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

      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
