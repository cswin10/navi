'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckSquare, Clock, CheckCircle2, Mic, ArrowRight, FileText, Folder, Plus, AlertCircle, Calendar, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { SkeletonDashboard, SkeletonTaskCard, SkeletonNoteCard } from '@/components/ui/Skeleton'
import GettingStarted from '@/components/dashboard/GettingStarted'

// Helper to check if a task is overdue
function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  const dueDate = new Date(task.due_date)
  dueDate.setHours(23, 59, 59, 999)
  return dueDate < new Date()
}

// Helper to check if due today
function isDueToday(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(task.due_date)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate.getTime() === today.getTime()
}

interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

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
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [dueTodayTasks, setDueTodayTasks] = useState<Task[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [hasCalendar, setHasCalendar] = useState(false)
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

        // Set overdue and due today tasks
        const overdue = tasks.filter((t: Task) => isOverdue(t))
        const dueToday = tasks.filter((t: Task) => isDueToday(t))
        setOverdueTasks(overdue)
        setDueTodayTasks(dueToday)
      }

      // Check for calendar integration and load today's events
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_type', 'google_calendar')
        .eq('is_active', true)
        .maybeSingle()

      if (integration) {
        setHasCalendar(true)
        // Try to load today's calendar events
        try {
          const response = await fetch('/api/calendar/today')
          const data = await response.json()
          if (data.success && data.events) {
            setCalendarEvents(data.events.slice(0, 5))
          }
        } catch (error) {
          // Calendar fetch failed silently
        }
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

  // Quick complete task
  async function handleQuickComplete(taskId: string) {
    const supabase = createClient()
    const { error } = await (supabase
      .from('tasks') as any)
      .update({ status: 'done' })
      .eq('id', taskId)

    if (!error) {
      // Update local state
      setOverdueTasks(overdueTasks.filter(t => t.id !== taskId))
      setDueTodayTasks(dueTodayTasks.filter(t => t.id !== taskId))
      setRecentTasks(recentTasks.map(t =>
        t.id === taskId ? { ...t, status: 'done' as const } : t
      ))
      setStats(prev => ({
        ...prev,
        todoTasks: prev.todoTasks - 1,
        completedTasks: prev.completedTasks + 1,
      }))
    }
  }

  // Format calendar time
  function formatEventTime(event: CalendarEvent): string {
    if (event.start.dateTime) {
      const date = new Date(event.start.dateTime)
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }
    return 'All day'
  }

  if (loading) {
    return <SkeletonDashboard />
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-400">Welcome back! Here's your overview.</p>
      </div>

      {/* Getting Started - Only shows for new users */}
      <GettingStarted />

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

      {/* Today's Focus - Only show if there are items */}
      {(overdueTasks.length > 0 || dueTodayTasks.length > 0 || calendarEvents.length > 0) && (
        <Card className="border-blue-500/30">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-blue-400" />
              </div>
              <CardTitle className="text-base sm:text-lg">Today's Focus</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4">
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <h4 className="text-sm font-medium text-red-400">Overdue ({overdueTasks.length})</h4>
                </div>
                <div className="space-y-2">
                  {overdueTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2.5 bg-red-500/10 rounded-lg border border-red-500/30"
                    >
                      <button
                        onClick={() => handleQuickComplete(task.id)}
                        className="w-5 h-5 rounded border-2 border-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0"
                        title="Mark as done"
                      >
                        <Check className="w-3 h-3 text-transparent hover:text-red-400" />
                      </button>
                      <span className="text-white text-sm flex-1 truncate">{task.title}</span>
                      <Badge variant="danger" className="text-[10px]">
                        {formatDate(task.due_date!)}
                      </Badge>
                    </div>
                  ))}
                  {overdueTasks.length > 3 && (
                    <Link href="/dashboard/tasks?filter=overdue">
                      <p className="text-xs text-red-400 hover:underline">
                        +{overdueTasks.length - 3} more overdue tasks
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Due Today */}
            {dueTodayTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-sm font-medium text-yellow-400">Due Today ({dueTodayTasks.length})</h4>
                </div>
                <div className="space-y-2">
                  {dueTodayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2.5 bg-yellow-500/10 rounded-lg border border-yellow-500/30"
                    >
                      <button
                        onClick={() => handleQuickComplete(task.id)}
                        className="w-5 h-5 rounded border-2 border-yellow-400 flex items-center justify-center hover:bg-yellow-500/20 transition-colors flex-shrink-0"
                        title="Mark as done"
                      >
                        <Check className="w-3 h-3 text-transparent hover:text-yellow-400" />
                      </button>
                      <span className="text-white text-sm flex-1 truncate">{task.title}</span>
                      <Badge variant={task.priority} className="text-[10px]">
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                  {dueTodayTasks.length > 3 && (
                    <Link href="/dashboard/tasks?filter=today">
                      <p className="text-xs text-yellow-400 hover:underline">
                        +{dueTodayTasks.length - 3} more tasks due today
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Calendar Events */}
            {calendarEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-medium text-blue-400">Today's Schedule</h4>
                </div>
                <div className="space-y-2">
                  {calendarEvents.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/30"
                    >
                      <div className="w-5 h-5 rounded bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="text-white text-sm flex-1 truncate">{event.summary}</span>
                      <span className="text-xs text-blue-400 font-mono">
                        {formatEventTime(event)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
          {recentTasks.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <CheckSquare className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-slate-400 mb-2 text-sm">No tasks yet!</p>
              <p className="text-slate-500 text-xs mb-4">Try saying: "Add a task to review the project proposal"</p>
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
          {recentNotes.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-slate-400 mb-2 text-sm">No notes yet!</p>
              <p className="text-slate-500 text-xs mb-4">Try saying: "Take a note about the meeting summary"</p>
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
