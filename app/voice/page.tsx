'use client';

// Navi AI - Voice-first AI Personal Operating System
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VoiceInput from '@/components/VoiceInput';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import ConfirmationPanel from '@/components/ConfirmationPanel';
import ProofPanel from '@/components/ProofPanel';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { AppState, ActionState, ClaudeIntentResponse, ExecutionResult } from '@/lib/types';
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
          router.push('/login');
          return;
        }

        setUserId(user.id);

        // Create session for this user
        const { data, error } = await (supabase
          .from('sessions') as any)
          .insert({ user_id: user.id })
          .select()
          .single();

        if (error) throw error;

        setSessionId(data.id);
      } catch (error) {
        // Session initialization failed silently
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
        break;
      }
    }

    return cleaned;
  };

  const handleTranscript = async (text: string) => {
    // Clean stop phrases from the end of the transcript
    const cleanedText = cleanStopPhrases(text);

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

      if (!processData.success) {
        throw new Error(processData.error || 'Failed to process intent');
      }

      // Determine if we have valid intents (single or multiple)
      let validIntent: any = null;
      let validIntents: any[] = [];

      // Check multiple intents first
      if (processData.intents && Array.isArray(processData.intents)) {
        validIntents = processData.intents.filter((i: any) => i && typeof i === 'object' && i.intent);
        if (validIntents.length > 0) {
          validIntent = validIntents[0];
        }
      }

      // Check single intent if no valid multiple intents
      if (!validIntent && processData.intent && typeof processData.intent === 'object' && processData.intent.intent) {
        validIntent = processData.intent;
      }

      // If still no valid intent, throw error
      if (!validIntent) {
        throw new Error('Invalid response from assistant - please try again');
      }

      // Update processData with validated data
      processData.intent = validIntent;
      processData.intents = validIntents.length > 0 ? validIntents : undefined;

      // Determine the response text for TTS
      const responseText = processData.response || processData.intent?.response || '';

      // Generate voice response
      const speakResponse = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: responseText }),
      });

      const speakData = await speakResponse.json();

      // TTS may fail silently - voice response is optional

      // Handle multiple intents
      if (processData.intents && processData.intents.length > 0) {
        // For multiple intents, use the first one as the primary intent
        // Store all intents in state for batch execution
        setActionState((prev) => ({
          ...prev,
          intent: processData.intents[0],
          intents: processData.intents,
          audioUrl: speakData.audioUrl || null,
        }));

        // Check if all intents require confirmation
        const needsConfirmation = processData.intents.some(
          (intent: any) => !['remember', 'get_weather', 'get_news', 'get_calendar_events', 'get_tasks', 'get_notes', 'other'].includes(intent.intent)
        );

        if (needsConfirmation) {
          setAppState('confirming');
        } else {
          // Auto-execute all intents
          await handleConfirmMultiple(processData.intents);
        }
        return;
      }

      // Single intent handling
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
            await fetch('/api/store-conversation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                transcript: cleanedText,
                intent: processData.intent,
              }),
            });
          } catch (error) {
            // Conversation storage is non-critical
          }
        }
        setAppState('idle');
      } else if (['remember', 'get_weather', 'get_news', 'get_calendar_events', 'get_tasks', 'get_notes'].includes(processData.intent.intent)) {
        // Auto-execute: remember, weather, news, get calendar, get tasks, get notes (no confirmation needed)
        await handleConfirm(processData.intent);
      } else {
        // Actions (create_task, send_email, add_calendar_event, timeblock_day, update_task): Require confirmation
        setAppState('confirming');
      }
    } catch (error: any) {
      setActionState((prev) => ({
        ...prev,
        error: error.message,
      }));
      setAppState('error');
    }
  };

  const handleConfirm = async (editedIntent?: ClaudeIntentResponse) => {
    // Check if we have multiple intents (and no single edited intent override)
    if (!editedIntent && actionState.intents && actionState.intents.length > 1) {
      return handleConfirmMultiple();
    }

    // Use edited intent if provided, otherwise fall back to original
    const intent = editedIntent || actionState.intent;

    if (!intent || !sessionId) {
      return;
    }

    // Validate intent has a proper type (should be guaranteed by earlier validation, but safety check)
    if (!intent.intent) {
      setActionState((prev) => ({
        ...prev,
        error: 'Invalid intent received from assistant',
        executionResult: {
          success: false,
          error: 'Invalid intent received from assistant',
        },
        audioUrl: null,
      }));
      setAppState('completed');
      return;
    }

    setAppState('executing');

    try {
      // Clean the intent to remove any non-serializable data
      const cleanIntent = {
        intent: intent.intent,
        response: intent.response,
        parameters: intent.parameters ? JSON.parse(JSON.stringify(intent.parameters)) : {}, // Deep clone to remove references
      };

      const executeResponse = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: cleanIntent,
          sessionId,
          transcript: actionState.transcript,
        }),
      });

      const executeData = await executeResponse.json();

      if (!executeData.success || !executeData.result) {
        throw new Error(executeData.error || 'Failed to execute action');
      }

      // Generate TTS for the execution result
      // Use spokenResponse if available (brief), otherwise use response or displayResponse
      const textToSpeak = executeData.result.spokenResponse || executeData.result.response || executeData.result.displayResponse;

      if (textToSpeak) {
        try {
          const speakResponse = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSpeak }),
          });

          const speakData = await speakResponse.json();

          setActionState((prev) => ({
            ...prev,
            executionResult: executeData.result,
            audioUrl: (speakData.success && speakData.audioUrl) ? speakData.audioUrl : null,
          }));
        } catch (speakError) {
          setActionState((prev) => ({
            ...prev,
            executionResult: executeData.result,
            audioUrl: null,
          }));
        }
      } else {
        setActionState((prev) => ({
          ...prev,
          executionResult: executeData.result,
          audioUrl: null,
        }));
      }

      setAppState('completed');
    } catch (error: any) {
      setActionState((prev) => ({
        ...prev,
        error: error.message,
        executionResult: {
          success: false,
          error: error.message,
        },
        audioUrl: null,
      }));
      setAppState('completed');
    }
  };

  const handleConfirmMultiple = async (intentsToExecute?: ClaudeIntentResponse[]) => {
    const intents = intentsToExecute || actionState.intents;

    if (!intents || intents.length === 0 || !sessionId) {
      return;
    }

    setAppState('executing');

    try {
      const results: ExecutionResult[] = [];
      let allSuccessful = true;

      // Filter out any invalid intents without a proper type
      const validIntents = intents.filter(i => i.intent);

      if (validIntents.length === 0) {
        throw new Error('No valid intents to execute');
      }

      // Execute each intent sequentially
      for (const intent of validIntents) {
        try {
          // Clean the intent to remove any non-serializable data
          const cleanIntent = {
            intent: intent.intent,
            response: intent.response,
            parameters: intent.parameters ? JSON.parse(JSON.stringify(intent.parameters)) : {}, // Deep clone to remove references
          };

          const executeResponse = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              intent: cleanIntent,
              sessionId,
              transcript: actionState.transcript,
            }),
          });

          const executeData = await executeResponse.json();

          if (!executeData.success || !executeData.result) {
            allSuccessful = false;
            results.push({
              success: false,
              error: executeData.error || 'Failed to execute action',
            });
          } else {
            results.push(executeData.result);
          }
        } catch (error: any) {
          allSuccessful = false;
          results.push({
            success: false,
            error: error.message,
          });
        }
      }

      // Combine results into a single execution result
      const successfulCount = results.filter(r => r.success).length;
      const combinedResult: ExecutionResult = {
        success: allSuccessful,
        displayResponse: results
          .map((r, i) => {
            const intentName = intents[i].intent;
            if (r.success) {
              return `✓ ${intentName}: ${r.displayResponse || r.response || 'Completed'}`;
            } else {
              return `✗ ${intentName}: ${r.error || 'Failed'}`;
            }
          })
          .join('\n\n'),
        spokenResponse: allSuccessful
          ? `All ${successfulCount} actions completed.`
          : `${successfulCount} of ${results.length} actions completed.`,
      };

      // Generate TTS for the combined result
      const textToSpeak = combinedResult.spokenResponse;
      if (textToSpeak) {
        try {
          const speakResponse = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSpeak }),
          });

          const speakData = await speakResponse.json();

          setActionState((prev) => ({
            ...prev,
            executionResult: combinedResult,
            // Always update audioUrl - either with new audio or null to prevent old audio from playing
            audioUrl: (speakData.success && speakData.audioUrl) ? speakData.audioUrl : null,
          }));
        } catch (speakError) {
          setActionState((prev) => ({
            ...prev,
            executionResult: combinedResult,
            audioUrl: null, // Clear old audio to prevent replay
          }));
        }
      } else {
        setActionState((prev) => ({
          ...prev,
          executionResult: combinedResult,
          audioUrl: null, // Clear old audio
        }));
      }

      setAppState('completed');
    } catch (error: any) {
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
    resetState();
  };

  const handleNewAction = () => {
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Animated spinner */}
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 rounded-full border-4 border-blue-500/30"
                    style={{ borderTopColor: 'rgb(59, 130, 246)' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 font-medium text-lg">Navi is thinking...</p>
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
                {/* Check if Navi is asking a question (needs response) */}
                {actionState.intent.response?.includes('?') ? (
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <p>Press and hold to respond...</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p>Ready for your next request...</p>
                  </div>
                )}
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
              intents={actionState.intents}
              audioUrl={actionState.audioUrl}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}

          {/* Executing state */}
          {appState === 'executing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Animated spinner */}
              <div className="relative">
                <motion.div
                  className="w-16 h-16 rounded-full border-4 border-green-500/30"
                  style={{ borderTopColor: 'rgb(34, 197, 94)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6 text-green-400" />
                  </motion.div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-medium text-lg">Taking action...</p>
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
