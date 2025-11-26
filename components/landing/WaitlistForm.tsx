'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react'

interface WaitlistFormProps {
  className?: string
  size?: 'default' | 'large'
}

export function WaitlistForm({ className = '', size = 'default' }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      setStatus('success')
      setEmail('')
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong')
      setStatus('error')
    }
  }

  const isLarge = size === 'large'

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`flex items-center gap-2 ${isLarge ? 'text-lg' : 'text-base'} text-green-400`}
          >
            <CheckCircle className={isLarge ? 'w-6 h-6' : 'w-5 h-5'} />
            <span>You're on the list! We'll be in touch soon.</span>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              placeholder="Enter your email"
              className={`
                flex-1 rounded-lg bg-slate-800/50 border border-slate-700
                px-4 text-white placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all
                ${isLarge ? 'py-4 text-lg min-w-[300px]' : 'py-3 text-base min-w-[250px]'}
              `}
              disabled={status === 'loading'}
            />
            <Button
              type="submit"
              size={isLarge ? 'lg' : 'md'}
              disabled={status === 'loading'}
              className={`group whitespace-nowrap ${isLarge ? 'px-8' : 'px-6'}`}
            >
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Join Waitlist
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {status === 'error' && errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm mt-2"
        >
          {errorMessage}
        </motion.p>
      )}
    </div>
  )
}
