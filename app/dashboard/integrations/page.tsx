'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Integration {
  id: string
  integration_type: string
  is_active: boolean
  created_at: string
}

function IntegrationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Check for OAuth success message
    const success = searchParams.get('success')
    if (success === 'google_connected') {
      setSuccessMessage('Google connected successfully! You can now use Calendar and Email.')
      setTimeout(() => setSuccessMessage(''), 5000)
    }

    loadIntegrations()
  }, [searchParams])

  async function loadIntegrations() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if Google is connected (calendar + gmail)
    const { data: googleData } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', 'google_calendar')
      .eq('is_active', true)
      .maybeSingle()

    setGoogleConnected(!!googleData)
    setLoading(false)
  }

  function handleConnectGoogle() {
    // Redirect to Google OAuth with both calendar and gmail scopes
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/google/callback`
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.send'
    ].join(' ')

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`

    window.location.href = authUrl
  }

  async function handleDisconnectGoogle() {
    if (!confirm('Are you sure you want to disconnect Google? This will disable both Calendar and Email.')) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Delete both calendar and gmail integrations
      await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .in('integration_type', ['google_calendar', 'google_gmail'])

      setGoogleConnected(false)
      setSuccessMessage('Google disconnected')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading integrations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Integrations</h1>
        <p className="text-sm sm:text-base text-slate-400">Connect your accounts to enable more capabilities</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400">
          {successMessage}
        </div>
      )}

      {/* Google Integration Card (Calendar + Gmail) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">G</span>
              </div>
              <div>
                <CardTitle>Google</CardTitle>
                <CardDescription>
                  Connect Google to enable Calendar and Email features
                </CardDescription>
              </div>
            </div>
            {googleConnected ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {googleConnected ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className="text-white font-medium mt-1">
                  Calendar and Email are ready to use
                </p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-sm text-slate-300">
                <p className="font-medium text-white mb-2">Voice Commands:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>"Send an email to John about the meeting"</li>
                  <li>"Add a meeting at 2pm tomorrow"</li>
                  <li>"What do I have today?"</li>
                  <li>"Timeblock my day: 9-11am deep work, 11-12pm emails"</li>
                </ul>
              </div>
              <Button variant="danger" onClick={handleDisconnectGoogle}>
                Disconnect Google
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300 space-y-2">
                    <p className="font-medium text-white">One click to enable:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Calendar:</strong> Add events, check schedule, timeblock your day</li>
                      <li><strong>Email:</strong> Send emails via voice commands</li>
                    </ul>
                    <p className="text-slate-400 mt-2">
                      You'll be redirected to Google to authorize access.
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleConnectGoogle}>
                Connect Google
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Integrations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 opacity-50">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔔</span>
              </div>
              <div>
                <CardTitle>Slack</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading integrations...</p>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  )
}
