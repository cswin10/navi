'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate terms agreement
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      setLoading(false)
      return
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name,
          },
        },
      })

      if (authError) throw authError

      // Show success message - user needs to confirm email
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Create your account</CardTitle>
            <CardDescription className="text-sm">
              Get started with your personal AI operating system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {success ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-green-400 font-medium text-sm sm:text-base mb-2">Check your email!</h3>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    We've sent a confirmation email to <strong>{email}</strong>
                  </p>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2">
                    Click the link in the email to verify your account and get started.
                  </p>
                </div>
                <p className="text-center text-xs sm:text-sm text-slate-400">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    try again
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Input
                  label="Name (optional)"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Type your password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {/* Terms & Privacy Consent */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-300">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-400 hover:underline" target="_blank">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-400 hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <Button
                  type="submit"
                  className="w-full text-sm sm:text-base"
                  isLoading={loading}
                  disabled={loading}
                >
                  Create Account
                </Button>

                <p className="text-center text-xs sm:text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4 px-4">
          Your data is processed securely.{' '}
          <Link href="/privacy" className="text-slate-400 hover:text-slate-300">Learn more</Link>
        </p>
      </div>
    </div>
  )
}
