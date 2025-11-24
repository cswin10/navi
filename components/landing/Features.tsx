'use client'

import { motion } from 'framer-motion'
import { Mic, CheckSquare, Mail, Bell, Brain, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

const features = [
  {
    icon: Mic,
    title: 'Natural Voice Commands',
    description: 'Talk to Navi like you would a real assistant. She understands context and gets things done without complicated commands.',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Create tasks, set priorities, and add due dates just by speaking. Navi keeps track of everything so you do not have to.',
  },
  {
    icon: Mail,
    title: 'Send Emails Instantly',
    description: 'Connect your Gmail and send professional emails with your voice. Navi drafts them, you approve them, done.',
  },
  {
    icon: Bell,
    title: 'Calendar Intelligence',
    description: 'Check your schedule, add events, and time block your day. Ask when you are free and Navi will tell you.',
  },
  {
    icon: Brain,
    title: 'Remembers Everything',
    description: 'Tell Navi about your preferences, contacts, and workflows. She learns and gets smarter over time.',
  },
  {
    icon: Shield,
    title: 'Your Data Stays Private',
    description: 'Everything is encrypted and isolated to your account. We never sell or share your information.',
  },
]

export function Features() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
            Built For{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              How You Actually Work
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto px-4">
            Navi connects to your real tools and handles the boring stuff, so you can focus on what matters.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Card className="h-full hover:border-blue-500/50 transition-colors">
                <CardContent className="p-4 sm:p-5 lg:pt-6">
                  <div className="rounded-full bg-blue-500/10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-1.5 sm:mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
