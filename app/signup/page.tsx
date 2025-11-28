'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { WaitlistForm } from '@/components/landing/WaitlistForm'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Navi AI
          </span>
        </Link>

        <Card>
          <CardHeader className="p-4 sm:p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Coming Soon</CardTitle>
            <CardDescription className="text-sm">
              Navi AI is currently in private beta. Join the waitlist to get early access when we launch.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4">
              <WaitlistForm />

              <div className="text-center">
                <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
                  Learn more about Navi AI
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
