'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Sparkles, Home, CheckSquare, FileText, Bell, User, Settings, LogOut, Mic, Plug, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Notes', href: '/dashboard/notes', icon: FileText },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await (supabase
        .from('user_profiles') as any)
        .select('name')
        .eq('id', user.id)
        .single()

      if (profile?.name) {
        setUserName(profile.name)
      }
    }

    loadUser()
  }, [router])

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Force a full page refresh to clear all state
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Navi AI" className="w-7 h-7" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Navi AI
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen pt-[52px] lg:pt-0">
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-slate-900/95 lg:bg-slate-900/50 border-r border-slate-800 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-[52px] lg:pt-0
        `}>
          {/* Logo - hidden on mobile (shown in header) */}
          <div className="hidden lg:block p-6 border-b border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Navi AI" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Navi AI
              </span>
            </Link>
            {userName && (
              <p className="text-sm text-slate-400 mt-2">Welcome, {userName}</p>
            )}
          </div>

          {/* Welcome on mobile */}
          {userName && (
            <div className="lg:hidden px-4 py-3 border-b border-slate-800">
              <p className="text-sm text-slate-400">Welcome, {userName}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 active:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm lg:text-base">{item.name}</span>
                </Link>
              )
            })}

            {/* Voice Assistant Link */}
            <Link
              href="/voice"
              className="flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-purple-400 hover:bg-slate-800 active:bg-slate-700 transition-colors mt-4 border border-purple-500/30"
            >
              <Mic className="w-5 h-5" />
              <span className="font-medium text-sm lg:text-base">Voice Assistant</span>
            </Link>
          </nav>

          {/* Logout */}
          <div className="p-3 lg:p-4 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm lg:text-base"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
