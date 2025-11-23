'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Brain, Save } from 'lucide-react'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  context_memory: Record<string, string>
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [contextMemory, setContextMemory] = useState<Record<string, string>>({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

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

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setName(data.name || '')
      setContextMemory(data.context_memory || {})
    }

    setLoading(false)
  }

  async function handleSaveProfile() {
    if (!profile) return

    setSaving(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name,
          context_memory: contextMemory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) {
        throw error
      }

      alert('Profile updated successfully!')
      await loadProfile()
    } catch (error: any) {
      alert(`Failed to update profile: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  function handleAddContext() {
    if (!newKey.trim() || !newValue.trim()) return

    setContextMemory({
      ...contextMemory,
      [newKey]: newValue,
    })
    setNewKey('')
    setNewValue('')
  }

  function handleRemoveContext(key: string) {
    const updated = { ...contextMemory }
    delete updated[key]
    setContextMemory(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
        <p className="text-slate-400">Manage your account settings and preferences</p>
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

      {/* Context Memory */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle>Context Memory</CardTitle>
              <CardDescription>
                Teach Navi about yourself so it can provide personalized assistance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-medium text-white mb-1">What is Context Memory?</p>
            <p>
              Context Memory helps Navi remember important details about you, like your location,
              work schedule, preferences, or frequently contacted people. This allows Navi to provide
              more relevant and personalized responses.
            </p>
            <p className="mt-2">
              <strong>Examples:</strong> timezone → Europe/London, work_hours → 9am-5pm,
              manager_email → boss@company.com
            </p>
          </div>

          {/* Existing Context */}
          {Object.keys(contextMemory).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-300">Current Context:</h4>
              {Object.entries(contextMemory).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-400">{key}</p>
                    <p className="text-sm text-slate-300 mt-0.5">{value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContext(key)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Context */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Add New Context:</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. timezone"
              />
              <Input
                label="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. Europe/London"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleAddContext}
              disabled={!newKey.trim() || !newValue.trim()}
            >
              Add Context
            </Button>
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
    </div>
  )
}
