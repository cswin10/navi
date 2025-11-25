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

interface KnowledgeSections {
  people: string
  location: string
  schedule: string
  projects: string
  preferences: string
  goals: string
  other: string
}

function parseKnowledgeBase(kb: string): KnowledgeSections {
  const sections: KnowledgeSections = {
    people: '',
    location: '',
    schedule: '',
    projects: '',
    preferences: '',
    goals: '',
    other: '',
  }

  if (!kb) return sections

  // Parse markdown-style sections
  const sectionRegex = /## (People|Location|Schedule|Projects|Preferences|Goals|Other)\n([\s\S]*?)(?=\n## |$)/gi
  let match
  let usedContent = ''

  while ((match = sectionRegex.exec(kb)) !== null) {
    const sectionName = match[1].toLowerCase() as keyof KnowledgeSections
    const content = match[2].trim()
    if (sections.hasOwnProperty(sectionName)) {
      sections[sectionName] = content
      usedContent += match[0]
    }
  }

  // Any content not in a section goes to "other"
  const remainingContent = kb.replace(sectionRegex, '').trim()
  if (remainingContent && !sections.other) {
    sections.other = remainingContent
  }

  return sections
}

function buildKnowledgeBase(sections: KnowledgeSections): string {
  const parts: string[] = []

  if (sections.people.trim()) {
    parts.push(`## People\n${sections.people.trim()}`)
  }
  if (sections.location.trim()) {
    parts.push(`## Location\n${sections.location.trim()}`)
  }
  if (sections.schedule.trim()) {
    parts.push(`## Schedule\n${sections.schedule.trim()}`)
  }
  if (sections.projects.trim()) {
    parts.push(`## Projects\n${sections.projects.trim()}`)
  }
  if (sections.preferences.trim()) {
    parts.push(`## Preferences\n${sections.preferences.trim()}`)
  }
  if (sections.goals.trim()) {
    parts.push(`## Goals\n${sections.goals.trim()}`)
  }
  if (sections.other.trim()) {
    parts.push(`## Other\n${sections.other.trim()}`)
  }

  return parts.join('\n\n')
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [knowledgeSections, setKnowledgeSections] = useState<KnowledgeSections>({
    people: '',
    location: '',
    schedule: '',
    projects: '',
    preferences: '',
    goals: '',
    other: '',
  })
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
      setKnowledgeSections(parseKnowledgeBase(data.knowledge_base || ''))
      setEmailSignature(data.email_signature || '')
    }

    setLoading(false)
  }

  function updateSection(section: keyof KnowledgeSections, value: string) {
    setKnowledgeSections(prev => ({ ...prev, [section]: value }))
  }

  async function handleSaveProfile() {
    if (!profile) return

    setSaving(true)

    try {
      const supabase = createClient()
      const knowledgeBase = buildKnowledgeBase(knowledgeSections)
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
                Fill in as much or as little as you like. Say "Remember that..." to add info via voice!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* People Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <label className="text-sm font-medium text-white">People</label>
              <span className="text-xs text-slate-500">Contacts, family, colleagues</span>
            </div>
            <textarea
              value={knowledgeSections.people}
              onChange={(e) => updateSection('people', e.target.value)}
              placeholder="My manager is Sarah (sarah@company.com)
John handles client accounts
My wife Emma's birthday is March 15"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          {/* Location Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <label className="text-sm font-medium text-white">Location</label>
              <span className="text-xs text-slate-500">Where you're based, timezone</span>
            </div>
            <textarea
              value={knowledgeSections.location}
              onChange={(e) => updateSection('location', e.target.value)}
              placeholder="Based in London, UK
Timezone: GMT/BST
Office at 123 Main Street"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          {/* Schedule Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <label className="text-sm font-medium text-white">Schedule</label>
              <span className="text-xs text-slate-500">Work hours, recurring meetings</span>
            </div>
            <textarea
              value={knowledgeSections.schedule}
              onChange={(e) => updateSection('schedule', e.target.value)}
              placeholder="Work hours: 9am-5pm
Team standup every Monday at 10am
Lunch break: 1-2pm (don't schedule meetings)"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          {/* Projects Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">💼</span>
              <label className="text-sm font-medium text-white">Projects</label>
              <span className="text-xs text-slate-500">Current work, deadlines</span>
            </div>
            <textarea
              value={knowledgeSections.projects}
              onChange={(e) => updateSection('projects', e.target.value)}
              placeholder="Website redesign - deadline March 15
Q1 marketing campaign - ongoing
Client proposal for Acme Corp"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          {/* Preferences Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <label className="text-sm font-medium text-white">Preferences</label>
              <span className="text-xs text-slate-500">How you like things done</span>
            </div>
            <textarea
              value={knowledgeSections.preferences}
              onChange={(e) => updateSection('preferences', e.target.value)}
              placeholder="Prefer morning meetings
Keep emails concise and professional
Always CC manager on client communications"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          {/* Goals Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <label className="text-sm font-medium text-white">Goals</label>
              <span className="text-xs text-slate-500">What you're working towards</span>
            </div>
            <textarea
              value={knowledgeSections.goals}
              onChange={(e) => updateSection('goals', e.target.value)}
              placeholder="Complete project certification by Q2
Read 2 books per month
Exercise 3 times per week"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          {/* Other Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <label className="text-sm font-medium text-white">Other</label>
              <span className="text-xs text-slate-500">Anything else Navi should know</span>
            </div>
            <textarea
              value={knowledgeSections.other}
              onChange={(e) => updateSection('other', e.target.value)}
              placeholder="Any other information..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
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
