'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Mail, CheckCircle2, XCircle, ExternalLink, AlertCircle } from 'lucide-react'

interface Integration {
  id: string
  integration_type: string
  is_active: boolean
  created_at: string
  credentials: {
    email?: string
  }
}

export default function IntegrationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [emailIntegration, setEmailIntegration] = useState<Integration | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadIntegrations()
  }, [])

  async function loadIntegrations() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', 'email')
      .maybeSingle()

    if (data) {
      setEmailIntegration(data)
    }

    setLoading(false)
  }

  async function handleConnectEmail() {
    if (!email || !appPassword) {
      setError('Please fill in all fields')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/integrations/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, appPassword }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect email')
      }

      await loadIntegrations()
      setShowEmailModal(false)
      setEmail('')
      setAppPassword('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnectEmail() {
    if (!confirm('Are you sure you want to disconnect your email?')) return

    try {
      const response = await fetch('/api/integrations/email', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect email')
      }

      setEmailIntegration(null)
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Integrations</h1>
        <p className="text-slate-400">Connect your accounts to enable more capabilities</p>
      </div>

      {/* Email Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                  Connect Gmail to send emails via voice commands
                </CardDescription>
              </div>
            </div>
            {emailIntegration ? (
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
          {emailIntegration ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Connected Account</p>
                <p className="text-white font-medium mt-1">
                  {emailIntegration.credentials.email}
                </p>
              </div>
              <Button variant="danger" onClick={handleDisconnectEmail}>
                Disconnect Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300 space-y-2">
                    <p className="font-medium text-white">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Enable 2-Factor Authentication on your Gmail account</li>
                      <li>Go to Google Account settings → Security → 2-Step Verification</li>
                      <li>Scroll to "App passwords" and generate a new password</li>
                      <li>Enter your email and the generated app password below</li>
                    </ol>
                    <a
                      href="https://support.google.com/accounts/answer/185833"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 mt-2"
                    >
                      Learn more about app passwords
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowEmailModal(true)}>
                Connect Gmail
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

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
      </div>

      {/* Email Connection Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false)
          setError('')
        }}
        title="Connect Gmail"
      >
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-200">
            <p className="font-medium mb-1">Security Note</p>
            <p className="text-yellow-300/80">
              Your credentials are encrypted and stored securely. We never store your actual password, only the app-specific password.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Input
            label="Gmail Address"
            type="email"
            placeholder="your.email@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="App Password"
            type="password"
            placeholder="16-character app password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleConnectEmail}
              className="flex-1"
              isLoading={saving}
              disabled={saving || !email || !appPassword}
            >
              Connect
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEmailModal(false)
                setError('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
