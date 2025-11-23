'use client'

import { motion } from 'framer-motion'
import { Mic, CheckSquare, Mail, Bell, Brain, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

const features = [
  {
    icon: Mic,
    title: 'Voice-First Interface',
    description: 'Simply speak your commands. NaviOS understands natural language and executes instantly.',
  },
  {
    icon: CheckSquare,
    title: 'Smart Task Management',
    description: 'Create, organize, and track tasks with priority levels and due dates—all by voice.',
  },
  {
    icon: Mail,
    title: 'Email Integration',
    description: 'Send emails hands-free. Just say who to email and what to say. NaviOS handles the rest.',
  },
  {
    icon: Bell,
    title: 'Intelligent Reminders',
    description: 'Set reminders in natural language. "Remind me tomorrow at 3pm" just works.',
  },
  {
    icon: Brain,
    title: 'Learns Your Preferences',
    description: 'NaviOS remembers your context and adapts to your workflow over time.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your data is encrypted and isolated. Only you have access to your information.',
  },
]

export function Features() {
  return (
    <section className="py-24 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Nothing You Don't
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            NaviOS is designed to be your personal AI operating system—powerful yet simple.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Card className="h-full hover:border-blue-500/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="rounded-full bg-blue-500/10 w-12 h-12 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
