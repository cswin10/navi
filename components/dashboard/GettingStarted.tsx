'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, Circle, Mic, User, Zap, X } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  actionLabel: string;
  completed: boolean;
}

export default function GettingStarted() {
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  async function checkSetupStatus() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Check if dismissed from localStorage
      const isDismissed = localStorage.getItem('navi_onboarding_dismissed');
      if (isDismissed === 'true') {
        setDismissed(true);
        setLoading(false);
        return;
      }

      // Check Google integration
      const { data: googleData } = await supabase
        .from('user_integrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('integration_type', 'google_calendar')
        .eq('is_active', true)
        .maybeSingle();

      // Check profile setup (has name or knowledge_base content)
      const { data: profileData } = await (supabase
        .from('user_profiles') as any)
        .select('name, knowledge_base')
        .eq('id', user.id)
        .maybeSingle();

      const hasProfile = !!(profileData?.name || (profileData?.knowledge_base && profileData.knowledge_base.length > 10));

      // Check if user has made any voice actions (tasks or notes)
      const { data: tasksData } = await (supabase
        .from('tasks') as any)
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const { data: notesData } = await (supabase
        .from('notes') as any)
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const hasUsedVoice = (tasksData && tasksData.length > 0) || (notesData && notesData.length > 0);

      setSteps([
        {
          id: 'google',
          title: 'Connect Google',
          description: 'Enable calendar and email features',
          icon: <Zap className="w-5 h-5" />,
          href: '/dashboard/integrations',
          actionLabel: 'Connect',
          completed: !!googleData,
        },
        {
          id: 'profile',
          title: 'Set up your profile',
          description: 'Help Navi learn about you',
          icon: <User className="w-5 h-5" />,
          href: '/dashboard/profile',
          actionLabel: 'Set up',
          completed: hasProfile,
        },
        {
          id: 'voice',
          title: 'Try a voice command',
          description: 'Say "Hello Navi" to get started',
          icon: <Mic className="w-5 h-5" />,
          href: '/voice',
          actionLabel: 'Try it',
          completed: hasUsedVoice,
        },
      ]);
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem('navi_onboarding_dismissed', 'true');
    setDismissed(true);
  }

  if (loading || dismissed) return null;

  const completedCount = steps.filter(s => s.completed).length;
  const allCompleted = completedCount === steps.length;

  // Don't show if all steps are completed
  if (allCompleted) return null;

  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
        <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Getting Started</CardTitle>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {completedCount} of {steps.length} completed
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-2">
          <div className="space-y-2 sm:space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  step.completed
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-slate-800/50 border border-slate-700 hover:border-blue-500/30'
                }`}
              >
                {/* Status icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.completed
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {step.completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${
                    step.completed ? 'text-green-400' : 'text-white'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {step.description}
                  </p>
                </div>

                {/* Action */}
                {!step.completed && (
                  <Link href={step.href}>
                    <Button size="sm" className="text-xs">
                      {step.actionLabel}
                    </Button>
                  </Link>
                )}
                {step.completed && (
                  <span className="text-xs text-green-400 font-medium">Done</span>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
