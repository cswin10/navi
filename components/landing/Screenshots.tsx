'use client'

import { motion } from 'framer-motion'
import { Mic, Calendar, Mail, CheckSquare } from 'lucide-react'

const screenshots = [
  {
    title: 'Voice Interface',
    description: 'Talk to Navi naturally and watch your requests come to life.',
    icon: Mic,
    placeholder: 'voice-interface',
  },
  {
    title: 'Task Management',
    description: 'Create and manage tasks with priorities and due dates.',
    icon: CheckSquare,
    placeholder: 'task-management',
  },
  {
    title: 'Calendar Integration',
    description: 'View your schedule and add events with Google Calendar sync.',
    icon: Calendar,
    placeholder: 'calendar-view',
  },
  {
    title: 'Email Drafting',
    description: 'Send professional emails through Gmail with your voice.',
    icon: Mail,
    placeholder: 'email-drafting',
  },
]

export function Screenshots() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-4">
            See Navi{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              In Action
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto px-4">
            A clean, intuitive interface designed for getting things done.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {screenshots.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group"
            >
              {/* Screenshot placeholder */}
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700 mb-4 group-hover:border-blue-500/50 transition-colors">
                {/* Replace with actual screenshots */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <item.icon className="w-12 h-12 text-blue-400/50 mb-3" />
                  <p className="text-slate-500 text-sm">Screenshot: {item.placeholder}.png</p>
                </div>
                {/* When you have screenshots, replace with:
                <img
                  src={`/screenshots/${item.placeholder}.png`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                */}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-400">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
