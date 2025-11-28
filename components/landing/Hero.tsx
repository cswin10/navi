'use client'

import { motion } from 'framer-motion'
import { Play, CheckCircle } from 'lucide-react'
import { WaitlistForm } from './WaitlistForm'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14 sm:pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/20 to-slate-900" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6"
          >
            <img
              src="/logo.svg"
              alt="Navi AI Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Navi AI
            </h1>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight"
          >
            Your AI Personal Assistant
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              That Actually Works
            </span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto px-4 sm:px-0"
          >
            Speak naturally and watch things happen. Send emails, manage your calendar, create tasks, and get real time information about your day. All with your voice.
          </motion.p>

          {/* Demo Video - Phone/Portrait Format */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-8 sm:mb-10 lg:mb-12 px-4 sm:px-0"
          >
            <div className="relative max-w-xs sm:max-w-sm mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-slate-800/50 border-4 border-slate-700 shadow-2xl shadow-blue-500/10">
              {/* Phone frame effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-700 rounded-b-xl z-10" />

              <video
                className="w-full h-full object-cover"
                controls
                playsInline
              >
                <source src="/1000023125.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-4 text-center">See Navi in action</p>
          </motion.div>

          {/* Waitlist Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col items-center px-4 sm:px-0"
          >
            <p className="text-white font-semibold text-lg sm:text-xl mb-4">
              Join the Waitlist for Early Access
            </p>
            <WaitlistForm size="large" />
            <p className="text-slate-400 text-sm mt-4">
              Be the first to try Navi when we launch.
            </p>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 sm:mt-10 lg:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-slate-400 px-4"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
              <span>Voice Powered</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
              <span>Real Integrations</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
              <span>Private & Secure</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
