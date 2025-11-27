'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Volume2, Loader2, ChevronDown } from 'lucide-react';
import { ClaudeIntentResponse, CreateTaskParams, SendEmailParams, AddCalendarEventParams, CreateNoteParams } from '@/lib/types';

interface ConfirmationPanelProps {
  intent: ClaudeIntentResponse;
  intents?: ClaudeIntentResponse[]; // Multiple intents
  audioUrl: string | null;
  onConfirm: (editedIntent?: ClaudeIntentResponse) => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

// Editable input component
function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  options,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'select' | 'email';
  options?: { value: string; label: string }[];
  multiline?: boolean;
}) {
  if (type === 'select' && options) {
    return (
      <div className="space-y-1">
        <label className="text-xs text-gray-500 capitalize">{label}</label>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    );
  }

  if (multiline) {
    return (
      <div className="space-y-1">
        <label className="text-xs text-gray-500 capitalize">{label}</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500 capitalize">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

// Task editing component
function TaskEditor({
  params,
  onChange,
}: {
  params: CreateTaskParams;
  onChange: (params: CreateTaskParams) => void;
}) {
  return (
    <div className="space-y-3">
      <EditableField
        label="Title"
        value={params.title}
        onChange={(v) => onChange({ ...params, title: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <EditableField
          label="Due Date"
          value={params.due_date || ''}
          onChange={(v) => onChange({ ...params, due_date: v || null })}
          type="date"
        />
        <EditableField
          label="Priority"
          value={params.priority}
          onChange={(v) => onChange({ ...params, priority: v as 'high' | 'medium' | 'low' })}
          type="select"
          options={[
            { value: 'high', label: '🔴 High' },
            { value: 'medium', label: '🟡 Medium' },
            { value: 'low', label: '🟢 Low' },
          ]}
        />
      </div>
    </div>
  );
}

// Email editing component
function EmailEditor({
  params,
  onChange,
}: {
  params: SendEmailParams;
  onChange: (params: SendEmailParams) => void;
}) {
  return (
    <div className="space-y-3">
      <EditableField
        label="To"
        value={params.to}
        onChange={(v) => onChange({ ...params, to: v })}
        type="email"
      />
      <EditableField
        label="Subject"
        value={params.subject}
        onChange={(v) => onChange({ ...params, subject: v })}
      />
      <EditableField
        label="Body"
        value={params.body}
        onChange={(v) => onChange({ ...params, body: v })}
        multiline
      />
    </div>
  );
}

// Calendar event editing component
function CalendarEventEditor({
  params,
  onChange,
}: {
  params: AddCalendarEventParams;
  onChange: (params: AddCalendarEventParams) => void;
}) {
  // Format date for display (handle 'today', 'tomorrow', or ISO date)
  const formatDateDisplay = (date?: string): string => {
    if (!date) return '';
    if (date === 'today' || date === 'tomorrow') return date;
    // ISO date format - parse and show nicely
    const d = new Date(date + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    return date;
  };

  return (
    <div className="space-y-3">
      <EditableField
        label="Title"
        value={params.title}
        onChange={(v) => onChange({ ...params, title: v })}
      />
      <EditableField
        label="Date"
        value={formatDateDisplay(params.date)}
        onChange={(v) => onChange({ ...params, date: v || undefined })}
      />
      <div className="grid grid-cols-2 gap-3">
        <EditableField
          label="Start Time"
          value={params.start_time}
          onChange={(v) => onChange({ ...params, start_time: v })}
        />
        <EditableField
          label="End Time"
          value={params.end_time || ''}
          onChange={(v) => onChange({ ...params, end_time: v || undefined })}
        />
      </div>
      <EditableField
        label="Location (optional)"
        value={params.location || ''}
        onChange={(v) => onChange({ ...params, location: v || undefined })}
      />
    </div>
  );
}

// Note editing component
function NoteEditor({
  params,
  onChange,
}: {
  params: CreateNoteParams;
  onChange: (params: CreateNoteParams) => void;
}) {
  return (
    <div className="space-y-3">
      <EditableField
        label="Title"
        value={params.title}
        onChange={(v) => onChange({ ...params, title: v })}
      />
      <EditableField
        label="Folder (optional)"
        value={params.folder || ''}
        onChange={(v) => onChange({ ...params, folder: v || undefined })}
      />
      <EditableField
        label="Content"
        value={params.content}
        onChange={(v) => onChange({ ...params, content: v })}
        multiline
      />
    </div>
  );
}

// Generic parameter display (read-only, for intents without editors)
function GenericParams({ params }: { params: Record<string, any> }) {
  return (
    <div className="space-y-1">
      {Object.entries(params).map(([key, value]) => {
        let displayValue: string;

        if (Array.isArray(value)) {
          if (key === 'blocks' && value.length > 0) {
            displayValue = value.map((block: any) =>
              `${block.start_time}-${block.end_time}: ${block.title}`
            ).join('\n');
          } else {
            displayValue = value.join(', ');
          }
        } else if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value, null, 2);
        } else {
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
  );
}

// Get icon/emoji for intent type
function getIntentIcon(intentType: string): string {
  const icons: Record<string, string> = {
    create_task: '📝',
    send_email: '📧',
    add_calendar_event: '📅',
    create_note: '📒',
    timeblock_day: '⏰',
    remember: '🧠',
  };
  return icons[intentType] || '✨';
}

// Get human-readable label for intent type
function getIntentLabel(intentType: string): string {
  const labels: Record<string, string> = {
    create_task: 'New Task',
    send_email: 'Send Email',
    add_calendar_event: 'Calendar Event',
    create_note: 'New Note',
    timeblock_day: 'Time Blocks',
    remember: 'Remember Info',
  };
  return labels[intentType] || intentType.replace(/_/g, ' ');
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
  const [editedIntent, setEditedIntent] = useState<ClaudeIntentResponse>(intent);
  const [editedIntents, setEditedIntents] = useState<ClaudeIntentResponse[]>(intents || [intent]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const initialAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (audioUrl && !initialAudioUrlRef.current) {
      initialAudioUrlRef.current = audioUrl;
    }
  }, [audioUrl]);

  // Auto-play the brief confirmation audio ("Okay, just to confirm")
  useEffect(() => {
    if (audioUrl && audioRef.current && !hasPlayedAudio && audioUrl === initialAudioUrlRef.current && !isExecuting) {
      setHasPlayedAudio(true);
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl, hasPlayedAudio, isExecuting]);

  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioEnded = () => setIsPlaying(false);

  // Update single intent parameters
  const updateParams = (newParams: any) => {
    setEditedIntent({
      ...editedIntent,
      parameters: newParams,
    });
  };

  // Update specific intent in multiple intents
  const updateMultipleParams = (index: number, newParams: any) => {
    const updated = [...editedIntents];
    updated[index] = {
      ...updated[index],
      parameters: newParams,
    };
    setEditedIntents(updated);
  };

  // Handle confirm with edited data
  const handleConfirm = () => {
    if (hasMultiple) {
      // For multiple intents, pass undefined to trigger handleConfirmMultiple in voice page
      // The voice page will use the stored intents array
      onConfirm(undefined);
    } else {
      onConfirm(editedIntent);
    }
  };

  // Render editor based on intent type
  const renderEditor = (currentIntent: ClaudeIntentResponse, index?: number) => {
    const params = currentIntent.parameters;
    const updateFn = index !== undefined
      ? (p: any) => updateMultipleParams(index, p)
      : updateParams;

    switch (currentIntent.intent) {
      case 'create_task':
        return <TaskEditor params={params as CreateTaskParams} onChange={updateFn} />;
      case 'send_email':
        return <EmailEditor params={params as SendEmailParams} onChange={updateFn} />;
      case 'add_calendar_event':
        return <CalendarEventEditor params={params as AddCalendarEventParams} onChange={updateFn} />;
      case 'create_note':
        return <NoteEditor params={params as CreateNoteParams} onChange={updateFn} />;
      default:
        return <GenericParams params={params as Record<string, any>} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-blue-700/50">
        {/* Confirmation header */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <p className="text-xs sm:text-sm text-blue-400 font-medium">
            Please confirm
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

        {/* Intent header */}
        <div className="mb-4">
          <p className="text-white text-base sm:text-lg leading-relaxed">
            {hasMultiple
              ? `I'll perform ${editedIntents.length} actions:`
              : intent.response}
          </p>
        </div>

        {/* Single intent editor */}
        {!hasMultiple && (
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{getIntentIcon(editedIntent.intent)}</span>
              <span className="text-sm font-medium text-blue-400">
                {getIntentLabel(editedIntent.intent)}
              </span>
            </div>
            {renderEditor(editedIntent)}
          </div>
        )}

        {/* Multiple intents */}
        {hasMultiple && editedIntents.map((singleIntent, index) => (
          <div key={index} className="bg-black/30 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{getIntentIcon(singleIntent.intent)}</span>
              <span className="text-sm font-medium text-blue-400">
                {index + 1}. {getIntentLabel(singleIntent.intent)}
              </span>
            </div>
            {renderEditor(singleIntent, index)}
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex gap-2 sm:gap-4 mt-4">
          <motion.button
            onClick={handleConfirm}
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
            onClick={() => onCancel()}
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
