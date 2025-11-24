'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { User, Brain, Save, BookOpen } from 'lucide-react'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  context_memory: Record<string, string>
  knowledge_base: string
  email_signature: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [knowledgeBase, setKnowledgeBase] = useState('')
  const [emailSignature, setEmailSignature] = useState('')

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await (supabase
      .from('user_profiles') as any)
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setName(data.name || '')
      setKnowledgeBase(data.knowledge_base || '')
      setEmailSignature(data.email_signature || '')
    }

    setLoading(false)
  }

  async function handleSaveProfile() {
    if (!profile) return

    setSaving(true)

    try {
      const supabase = createClient()
      const { error } = await (supabase
        .from('user_profiles') as any)
        .update({
          name,
          knowledge_base: knowledgeBase,
          email_signature: emailSignature,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) {
        throw error
      }

      setToast({ message: 'Changes saved successfully!', type: 'success' })
      await loadProfile()
    } catch (error: any) {
      setToast({ message: `Failed to save changes: ${error.message}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Profile</h1>
        <p className="text-sm sm:text-base text-slate-400">Teach Navi about yourself for personalized assistance</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <p className="text-white">{profile?.email}</p>
            <p className="text-xs text-slate-500 mt-1">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What Navi Should Know */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle>What Navi Should Know About You</CardTitle>
              <CardDescription>
                Add any information you want Navi to remember. The more she knows, the better she can help!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* How to add information */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-medium text-white mb-2">Two ways to teach Navi:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <div>
                  <p className="font-medium text-white">Type it here</p>
                  <p className="text-slate-400">Write or paste any information in the box below</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <div>
                  <p className="font-medium text-white">Tell Navi directly</p>
                  <p className="text-slate-400">Say "Remember that..." and she'll add it automatically</p>
                </div>
              </div>
            </div>
          </div>

          {/* Examples of what to include */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 text-sm">
            <p className="font-medium text-white mb-2">What to include:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-slate-300">
              <div>
                <p className="text-green-400 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">👥 People</p>
                <p className="text-[10px] sm:text-xs">Contacts, family, colleagues</p>
              </div>
              <div>
                <p className="text-green-400 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">📍 Location</p>
                <p className="text-[10px] sm:text-xs">Where you're based, timezone</p>
              </div>
              <div>
                <p className="text-green-400 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">📅 Schedule</p>
                <p className="text-[10px] sm:text-xs">Work hours, recurring meetings</p>
              </div>
              <div>
                <p className="text-green-400 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">💼 Projects</p>
                <p className="text-[10px] sm:text-xs">Current work, deadlines</p>
              </div>
              <div>
                <p className="text-green-400 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">⚙️ Preferences</p>
                <p className="text-[10px] sm:text-xs">How you like things done</p>
              </div>
              <div>
                <p className="text-green-400 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">🎯 Goals</p>
                <p className="text-[10px] sm:text-xs">What you're working towards</p>
              </div>
            </div>
          </div>

          {/* Text area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Your Information
              </label>
              <span className="text-xs text-slate-500">
                {knowledgeBase.length} characters
              </span>
            </div>
            <textarea
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              placeholder="Write anything Navi should know about you. Examples:

I'm based in London and work 9am-5pm GMT.

My manager is Sarah (sarah@company.com). Always CC her on important client emails.

I have a team standup every Monday at 10am.

Current projects:
- Website redesign (deadline: March 15)
- Q1 marketing campaign

I prefer morning meetings and don't schedule anything during lunch (1-2pm)."
              rows={12}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-2 italic">
              💡 Tip: The more you tell Navi, the more helpful she becomes!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Signature */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✍️</span>
            </div>
            <div>
              <CardTitle>Email Signature</CardTitle>
              <CardDescription>
                Add a signature to emails sent by Navi (optional)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-medium text-white mb-1">How it works:</p>
            <p>When Navi sends emails on your behalf, this signature will be automatically added at the end.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Signature
            </label>
            <textarea
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              placeholder="Example:

Best regards,
John Smith
Senior Product Manager
Company Name
john@company.com
+44 7700 900123"
              rows={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">
              This will be added to the end of every email Navi sends for you
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveProfile}
          isLoading={saving}
          disabled={saving}
          className="min-w-32"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
