'use client'

import { motion } from 'framer-motion'
import { Mic, LayoutDashboard, FileText, User } from 'lucide-react'

const screenshots = [
  {
    title: 'Voice Interface',
    description: 'Talk to Navi naturally and watch your requests come to life.',
    icon: Mic,
    image: '/voice-page.png',
  },
  {
    title: 'Dashboard',
    description: 'See your tasks, calendar, and quick actions at a glance.',
    icon: LayoutDashboard,
    image: '/dashboard-page.png',
  },
  {
    title: 'Notes',
    description: 'Create and organize notes with voice or text.',
    icon: FileText,
    image: '/notes-page.png',
  },
  {
    title: 'Profile & Knowledge',
    description: 'Teach Navi about you so it can help you better.',
    icon: User,
    image: '/profile-page.png',
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
              {/* Screenshot */}
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700 mb-4 group-hover:border-blue-500/50 transition-colors shadow-xl shadow-black/20">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover object-top"
                />
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
