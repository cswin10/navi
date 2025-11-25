'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckSquare, Clock, CheckCircle2, Mic, ArrowRight, FileText, Folder, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DashboardStats {
  totalTasks: number
  todoTasks: number
  inProgressTasks: number
  completedTasks: number
  todayTasks: number
}

interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
  created_at: string
}

interface Note {
  id: string
  title: string
  content: string
  folder: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    todayTasks: 0,
  })
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [recentNotes, setRecentNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Load tasks
      const { data: tasks } = await (supabase
        .from('tasks') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (tasks) {
        const today = new Date().toISOString().split('T')[0]

        setStats({
          totalTasks: tasks.length,
          todoTasks: tasks.filter((t: any) => t.status === 'todo').length,
          inProgressTasks: tasks.filter((t: any) => t.status === 'in_progress').length,
          completedTasks: tasks.filter((t: any) => t.status === 'done').length,
          todayTasks: tasks.filter((t: any) => t.due_date === today).length,
        })

        setRecentTasks(tasks.slice(0, 5))
      }

      // Load notes
      const { data: notes } = await (supabase
        .from('notes') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (notes) {
        setRecentNotes(notes)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-400">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Total Tasks</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 sm:mt-1">{stats.totalTasks}</p>
              </div>
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">To Do</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 sm:mt-1">{stats.todoTasks}</p>
              </div>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">In Progress</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 sm:mt-1">{stats.inProgressTasks}</p>
              </div>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Completed</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 sm:mt-1">{stats.completedTasks}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4">
            <Link href="/voice" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto text-sm">
                <Mic className="w-4 h-4 mr-2" />
                Voice Assistant
              </Button>
            </Link>
            <Link href="/dashboard/tasks?add=true" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </Link>
            <Link href="/dashboard/notes?add=true" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Recent Tasks</CardTitle>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                View All
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : recentTasks.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-slate-400 mb-3 sm:mb-4 text-sm">No tasks yet!</p>
              <Link href="/voice">
                <Button className="text-sm">
                  <Mic className="w-4 h-4 mr-2" />
                  Create your first task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-slate-800/50 rounded-lg border border-slate-700 gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm sm:text-base truncate mb-1.5 sm:mb-0">{task.title}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant={task.priority} className="text-[10px] sm:text-xs">{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</Badge>
                      <Badge variant={task.status} className="text-[10px] sm:text-xs">
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.due_date && (
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          Due: {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notes */}
      <Card>
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Recent Notes</CardTitle>
            <Link href="/dashboard/notes">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                View All
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : recentNotes.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-slate-400 mb-3 sm:mb-4 text-sm">No notes yet!</p>
              <Link href="/voice">
                <Button className="text-sm">
                  <Mic className="w-4 h-4 mr-2" />
                  Create your first note
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentNotes.map((note) => (
                <Link key={note.id} href="/dashboard/notes">
                  <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                        <h3 className="text-white font-medium text-sm sm:text-base truncate">{note.title}</h3>
                        {note.folder && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400">
                            <Folder className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span>{note.folder}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">
                        {note.content}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
