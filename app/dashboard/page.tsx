'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckSquare, Clock, CheckCircle2, Mic, ArrowRight, FileText, Folder } from 'lucide-react'
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Tasks</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalTasks}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">To Do</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.todoTasks}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">In Progress</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.inProgressTasks}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Completed</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.completedTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/voice">
              <Button>
                <Mic className="w-4 h-4 mr-2" />
                Use Voice Assistant
              </Button>
            </Link>
            <Link href="/dashboard/tasks">
              <Button variant="secondary">
                <CheckSquare className="w-4 h-4 mr-2" />
                View Tasks
              </Button>
            </Link>
            <Link href="/dashboard/integrations">
              <Button variant="secondary">
                Connect Email
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No tasks yet!</p>
              <Link href="/voice">
                <Button>
                  <Mic className="w-4 h-4 mr-2" />
                  Create your first task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">{task.title}</h3>
                      <Badge variant={task.priority}>{task.priority}</Badge>
                      <Badge variant={task.status}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {task.due_date && (
                      <p className="text-sm text-slate-400 mt-1">
                        Due: {formatDate(task.due_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Notes</CardTitle>
            <Link href="/dashboard/notes">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : recentNotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No notes yet!</p>
              <Link href="/voice">
                <Button>
                  <Mic className="w-4 h-4 mr-2" />
                  Create your first note
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <Link key={note.id} href="/dashboard/notes">
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer">
                    <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{note.title}</h3>
                        {note.folder && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Folder className="w-3 h-3" />
                            <span>{note.folder}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                        {note.content}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
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
