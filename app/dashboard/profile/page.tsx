'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { User, Brain, Save, Plus, Trash2, Check } from 'lucide-react'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  context_memory: Record<string, string>
  knowledge_base: string
  email_signature: string
  created_at: string
}

interface Person {
  name: string
  relationship: string
  email: string
}

interface KnowledgeSections {
  people: Person[]
  location: string[]
  schedule: string[]
  projects: string[]
  preferences: string[]
  goals: string[]
  other: string[]
}

function parseKnowledgeBase(kb: string): KnowledgeSections {
  const sections: KnowledgeSections = {
    people: [],
    location: [],
    schedule: [],
    projects: [],
    preferences: [],
    goals: [],
    other: [],
  }

  if (!kb) return sections

  // Parse markdown-style sections
  const sectionRegex = /## (People|Location|Schedule|Projects|Preferences|Goals|Other)\n([\s\S]*?)(?=\n## |$)/gi
  let match

  while ((match = sectionRegex.exec(kb)) !== null) {
    const sectionName = match[1].toLowerCase() as keyof KnowledgeSections
    const content = match[2].trim()

    if (sectionName === 'people') {
      // Parse people entries: "Name (relationship) - email" or "Name - relationship - email"
      const lines = content.split('\n').filter(l => l.trim())
      sections.people = lines.map(line => {
        // Try to parse structured format: "Name (relationship) - email@example.com"
        const structuredMatch = line.match(/^(.+?)\s*\((.+?)\)\s*-?\s*(.*)$/)
        if (structuredMatch) {
          return {
            name: structuredMatch[1].trim(),
            relationship: structuredMatch[2].trim(),
            email: structuredMatch[3].trim(),
          }
        }
        // Try format: "Name - relationship - email"
        const dashMatch = line.match(/^(.+?)\s*-\s*(.+?)\s*-\s*(.+)$/)
        if (dashMatch) {
          return {
            name: dashMatch[1].trim(),
            relationship: dashMatch[2].trim(),
            email: dashMatch[3].trim(),
          }
        }
        // Fallback: treat whole line as name
        return { name: line.trim(), relationship: '', email: '' }
      })
    } else {
      // Parse other sections as array of lines
      sections[sectionName] = content.split('\n').filter(l => l.trim())
    }
  }

  return sections
}

function buildKnowledgeBase(sections: KnowledgeSections): string {
  const parts: string[] = []

  // Build people section
  const peopleLines = sections.people
    .filter(p => p.name.trim())
    .map(p => {
      if (p.relationship && p.email) {
        return `${p.name} (${p.relationship}) - ${p.email}`
      } else if (p.relationship) {
        return `${p.name} (${p.relationship})`
      } else if (p.email) {
        return `${p.name} - ${p.email}`
      }
      return p.name
    })
  if (peopleLines.length > 0) {
    parts.push(`## People\n${peopleLines.join('\n')}`)
  }

  // Build other sections
  const sectionNames: (keyof Omit<KnowledgeSections, 'people'>)[] = ['location', 'schedule', 'projects', 'preferences', 'goals', 'other']
  const sectionTitles: Record<string, string> = {
    location: 'Location',
    schedule: 'Schedule',
    projects: 'Projects',
    preferences: 'Preferences',
    goals: 'Goals',
    other: 'Other',
  }

  for (const section of sectionNames) {
    const items = sections[section].filter(item => item.trim())
    if (items.length > 0) {
      parts.push(`## ${sectionTitles[section]}\n${items.join('\n')}`)
    }
  }

  return parts.join('\n\n')
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [knowledgeSections, setKnowledgeSections] = useState<KnowledgeSections>({
    people: [],
    location: [],
    schedule: [],
    projects: [],
    preferences: [],
    goals: [],
    other: [],
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

  // People management
  function addPerson() {
    setKnowledgeSections(prev => ({
      ...prev,
      people: [...prev.people, { name: '', relationship: '', email: '' }]
    }))
  }

  function updatePerson(index: number, field: keyof Person, value: string) {
    setKnowledgeSections(prev => ({
      ...prev,
      people: prev.people.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }))
  }

  function removePerson(index: number) {
    setKnowledgeSections(prev => ({
      ...prev,
      people: prev.people.filter((_, i) => i !== index)
    }))
  }

  // Section item management (for non-people sections)
  function addSectionItem(section: keyof Omit<KnowledgeSections, 'people'>) {
    setKnowledgeSections(prev => ({
      ...prev,
      [section]: [...prev[section], '']
    }))
  }

  function updateSectionItem(section: keyof Omit<KnowledgeSections, 'people'>, index: number, value: string) {
    setKnowledgeSections(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? value : item)
    }))
  }

  function removeSectionItem(section: keyof Omit<KnowledgeSections, 'people'>, index: number) {
    setKnowledgeSections(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }))
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
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Profile</h1>
        <p className="text-sm sm:text-base text-slate-400">Teach Navi about yourself for personalized assistance</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Update your personal details</CardDescription>
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
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">What Navi Should Know About You</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Fill in as much or as little as you like. Say &quot;Remember that...&quot; to add info via voice!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* People Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  <label className="text-sm font-medium text-white">People</label>
                </div>
                <span className="text-xs text-slate-500 ml-6 sm:ml-0">Contacts, family, colleagues</span>
              </div>
              <Button variant="ghost" size="sm" onClick={addPerson} className="text-purple-400 hover:text-purple-300 self-start sm:self-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add Person
              </Button>
            </div>
            {knowledgeSections.people.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No contacts added yet. Click "Add Person" to get started.</p>
            ) : (
              <div className="space-y-3">
                {knowledgeSections.people.map((person, index) => (
                  <div key={index} className="bg-slate-800/50 p-3 sm:p-4 rounded-lg border border-slate-700">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updatePerson(index, 'name', e.target.value)}
                          placeholder="Name"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                        <input
                          type="text"
                          value={person.relationship}
                          onChange={(e) => updatePerson(index, 'relationship', e.target.value)}
                          placeholder="Relationship"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                        <input
                          type="email"
                          value={person.email}
                          onChange={(e) => updatePerson(index, 'email', e.target.value)}
                          placeholder="Email (optional)"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removePerson(index)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <label className="text-sm font-medium text-white">Location</label>
                </div>
                <span className="text-xs text-slate-500 ml-6 sm:ml-0">Where you're based, timezone</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => addSectionItem('location')} className="text-purple-400 hover:text-purple-300 self-start sm:self-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {knowledgeSections.location.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No location info added yet.</p>
            ) : (
              <div className="space-y-2">
                {knowledgeSections.location.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateSectionItem('location', index, e.target.value)}
                      placeholder="e.g. Based in London, UK"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={() => removeSectionItem('location', index)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <label className="text-sm font-medium text-white">Schedule</label>
                </div>
                <span className="text-xs text-slate-500 ml-6 sm:ml-0">Work hours, recurring meetings</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => addSectionItem('schedule')} className="text-purple-400 hover:text-purple-300 self-start sm:self-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {knowledgeSections.schedule.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No schedule info added yet.</p>
            ) : (
              <div className="space-y-2">
                {knowledgeSections.schedule.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateSectionItem('schedule', index, e.target.value)}
                      placeholder="e.g. Team standup every Monday at 10am"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={() => removeSectionItem('schedule', index)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💼</span>
                  <label className="text-sm font-medium text-white">Projects</label>
                </div>
                <span className="text-xs text-slate-500 ml-6 sm:ml-0">Current work, deadlines</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => addSectionItem('projects')} className="text-purple-400 hover:text-purple-300 self-start sm:self-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {knowledgeSections.projects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No projects added yet.</p>
            ) : (
              <div className="space-y-2">
                {knowledgeSections.projects.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateSectionItem('projects', index, e.target.value)}
                      placeholder="e.g. Website redesign - deadline March 15"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={() => removeSectionItem('projects', index)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preferences Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <label className="text-sm font-medium text-white">Preferences</label>
                </div>
                <span className="text-xs text-slate-500 ml-6 sm:ml-0">How you like things done</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => addSectionItem('preferences')} className="text-purple-400 hover:text-purple-300 self-start sm:self-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {knowledgeSections.preferences.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No preferences added yet.</p>
            ) : (
              <div className="space-y-2">
                {knowledgeSections.preferences.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateSectionItem('preferences', index, e.target.value)}
                      placeholder="e.g. Keep emails concise and professional"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={() => removeSectionItem('preferences', index)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <label className="text-sm font-medium text-white">Goals</label>
                </div>
                <span className="text-xs text-slate-500 ml-6 sm:ml-0">What you're working towards</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => addSectionItem('goals')} className="text-purple-400 hover:text-purple-300 self-start sm:self-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {knowledgeSections.goals.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No goals added yet.</p>
            ) : (
              <div className="space-y-2">
                {knowledgeSections.goals.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateSectionItem('goals', index, e.target.value)}
                      placeholder="e.g. Complete project certification by Q2"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={() => removeSectionItem('goals', index)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <label className="text-sm font-medium text-white">Other</label>
                </div>
                <span className="text-xs text-slate-500 ml-6 sm:ml-0">Anything else Navi should know</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => addSectionItem('other')} className="text-purple-400 hover:text-purple-300 self-start sm:self-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {knowledgeSections.other.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No other info added yet.</p>
            ) : (
              <div className="space-y-2">
                {knowledgeSections.other.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateSectionItem('other', index, e.target.value)}
                      placeholder="Any other information..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={() => removeSectionItem('other', index)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Signature */}
      <Card>
        <CardHeader>
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">✍️</span>
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">Email Signature</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
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

      {/* Sticky Save Button */}
      <div className="sticky bottom-4 z-10 flex justify-center sm:justify-end px-4 sm:px-0">
        <div className={`backdrop-blur-sm border rounded-xl p-3 shadow-2xl transition-all duration-300 ${
          saved
            ? 'bg-green-600/95 border-green-500'
            : 'bg-slate-900/95 border-slate-700'
        }`}>
          <Button
            onClick={handleSaveProfile}
            isLoading={saving}
            disabled={saving || saved}
            variant={saved ? 'secondary' : 'primary'}
            className={`min-w-[160px] text-base font-semibold transition-all duration-300 ${
              saved ? 'bg-green-600 hover:bg-green-600 text-white border-green-500' : ''
            }`}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Saved!
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
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
