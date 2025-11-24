'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <img
              src="/logo.svg"
              alt="Navi AI"
              className="w-7 h-7 sm:w-8 sm:h-8"
            />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Navi AI
            </span>
          </Link>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
