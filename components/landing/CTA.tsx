'use client'

import { motion } from 'framer-motion'
import { WaitlistForm } from './WaitlistForm'

export function CTA() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Ready to Work Smarter?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-8 px-4">
            Join the waitlist and be among the first to experience the future of personal productivity.
          </p>

          <div className="flex justify-center">
            <WaitlistForm size="large" />
          </div>

          <p className="text-xs sm:text-sm text-slate-400 mt-4 sm:mt-6">
            No spam, ever. We'll only email you when it's time to get started.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
