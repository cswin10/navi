'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, Calendar, Check, AlertCircle, Filter, Mic } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { SkeletonTasksPage } from '@/components/ui/Skeleton'

// Helper to check if a task is overdue
function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  const dueDate = new Date(task.due_date)
  dueDate.setHours(23, 59, 59, 999)
  return dueDate < new Date()
}

type FilterOption = 'all' | 'today' | 'overdue' | 'week'

interface Task {
  id: string
  title: string
  notes: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
  created_at: string
}

type TaskStatus = 'todo' | 'in_progress' | 'done'

const statusConfig = {
  todo: { title: 'To Do', color: 'text-yellow-400' },
  in_progress: { title: 'In Progress', color: 'text-blue-400' },
  done: { title: 'Done', color: 'text-green-400' },
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<FilterOption>('all')

  // Form state
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    loadTasks()

    // Check for ?add=true to auto-open modal (client-side only)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('add') === 'true') {
        setShowAddModal(true)
        // Clear the query param
        window.history.replaceState({}, '', '/dashboard/tasks')
      }
    }
  }, [])

  async function loadTasks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await (supabase
      .from('tasks') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setTasks(data)
    }

    setLoading(false)
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }

  // Apply filter to tasks
  function filterTasks(taskList: Task[]): Task[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    switch (filter) {
      case 'today':
        return taskList.filter(task => {
          if (!task.due_date) return false
          const dueDate = new Date(task.due_date)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate.getTime() === today.getTime()
        })
      case 'overdue':
        return taskList.filter(task => isOverdue(task))
      case 'week':
        return taskList.filter(task => {
          if (!task.due_date) return false
          const dueDate = new Date(task.due_date)
          return dueDate >= today && dueDate <= weekFromNow
        })
      default:
        return taskList
    }
  }

  function getTasksByStatus(status: TaskStatus) {
    return filterTasks(tasks)
      .filter(task => task.status === status)
      .sort((a, b) => {
        // Sort overdue first, then by priority
        const aOverdue = isOverdue(a) ? 0 : 1
        const bOverdue = isOverdue(b) ? 0 : 1
        if (aOverdue !== bOverdue) return aOverdue - bOverdue
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  }

  // Quick complete task
  async function handleQuickComplete(taskId: string) {
    const supabase = createClient()
    const { error } = await (supabase
      .from('tasks') as any)
      .update({ status: 'done' })
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: 'done' as const } : t
      ))
    }
  }

  // Count helpers for filter badges
  const overdueCount = tasks.filter(t => isOverdue(t)).length
  const todayCount = tasks.filter(t => {
    if (!t.due_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(t.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() === today.getTime()
  }).length

  function handleDragStart(task: Task) {
    setDraggedTask(task)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleDrop(status: TaskStatus) {
    if (!draggedTask) return

    const supabase = createClient()
    const { error } = await (supabase
      .from('tasks') as any)
      .update({ status })
      .eq('id', draggedTask.id)

    if (!error) {
      setTasks(tasks.map(t =>
        t.id === draggedTask.id ? { ...t, status } : t
      ))
    }

    setDraggedTask(null)
  }

  async function handleAddTask() {
    if (!title.trim()) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await (supabase
      .from('tasks') as any)
      .insert({
        user_id: user.id,
        title,
        notes: notes || null,
        priority,
        status: 'todo',
        due_date: dueDate || null,
      })
      .select()
      .single()

    if (data) {
      setTasks([data, ...tasks])
      resetForm()
      setShowAddModal(false)
    }
  }

  async function handleUpdateTask() {
    if (!editingTask || !title.trim()) return

    const supabase = createClient()
    const { data, error } = await (supabase
      .from('tasks') as any)
      .update({
        title,
        notes: notes || null,
        priority,
        due_date: dueDate || null,
      })
      .eq('id', editingTask.id)
      .select()
      .single()

    if (data) {
      setTasks(tasks.map(t => t.id === editingTask.id ? data : t))
      resetForm()
      setEditingTask(null)
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return

    const supabase = createClient()
    const { error } = await (supabase
      .from('tasks') as any)
      .delete()
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId))
    }
  }

  function openEditModal(task: Task) {
    setEditingTask(task)
    setTitle(task.title)
    setNotes(task.notes || '')
    setPriority(task.priority)
    setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
  }

  function resetForm() {
    setTitle('')
    setNotes('')
    setPriority('medium')
    setDueDate('')
  }

  function closeModal() {
    setShowAddModal(false)
    setEditingTask(null)
    resetForm()
  }

  if (loading) {
    return <SkeletonTasksPage />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Tasks</h1>
          <p className="text-sm sm:text-base text-slate-400">Manage your tasks across all stages</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs"
        >
          All
        </Button>
        <Button
          variant={filter === 'today' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('today')}
          className="text-xs"
        >
          Due Today {todayCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-500/30 rounded-full">{todayCount}</span>}
        </Button>
        <Button
          variant={filter === 'overdue' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('overdue')}
          className={`text-xs ${overdueCount > 0 ? 'border-red-500/50' : ''}`}
        >
          <AlertCircle className={`w-3 h-3 mr-1 ${overdueCount > 0 ? 'text-red-400' : ''}`} />
          Overdue {overdueCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500/30 text-red-300 rounded-full">{overdueCount}</span>}
        </Button>
        <Button
          variant={filter === 'week' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('week')}
          className="text-xs"
        >
          This Week
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {(Object.keys(statusConfig) as TaskStatus[]).map(status => (
          <div
            key={status}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
            className="flex flex-col"
          >
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <div>
                <h2 className={`text-base sm:text-lg lg:text-xl font-semibold ${statusConfig[status].color}`}>
                  {statusConfig[status].title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
                  {getTasksByStatus(status).length} tasks
                </p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 flex-1">
              {getTasksByStatus(status).map(task => {
                const taskIsOverdue = isOverdue(task)
                return (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className={`cursor-move transition-colors ${
                      taskIsOverdue
                        ? 'border-red-500/50 bg-red-500/5 hover:border-red-400'
                        : 'hover:border-blue-500'
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 mb-2">
                        {/* Quick Complete Checkbox */}
                        {status !== 'done' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuickComplete(task.id)
                            }}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                              taskIsOverdue
                                ? 'border-red-400 hover:bg-red-500/20'
                                : 'border-slate-500 hover:border-green-400 hover:bg-green-500/20'
                            }`}
                            title="Mark as done"
                          >
                            <Check className="w-3 h-3 text-transparent hover:text-green-400" />
                          </button>
                        )}
                        {status === 'done' && (
                          <div className="mt-0.5 w-5 h-5 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}

                        <h3
                          className={`font-medium text-sm sm:text-base flex-1 cursor-pointer hover:text-blue-400 ${
                            status === 'done' ? 'text-slate-400 line-through' : 'text-white'
                          }`}
                          onClick={() => openEditModal(task)}
                        >
                          {task.title}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {task.notes && (
                        <p className="text-xs sm:text-sm text-slate-400 mb-2 line-clamp-2 ml-7">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-7">
                        <Badge variant={task.priority} className="text-[10px] sm:text-xs">{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</Badge>
                        {taskIsOverdue && (
                          <Badge variant="danger" className="text-[10px] sm:text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </Badge>
                        )}
                        {task.due_date && (
                          <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${
                            taskIsOverdue ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.due_date)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {getTasksByStatus(status).length === 0 && (
                <div className="text-center py-6 sm:py-8 text-slate-500 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                  {status === 'todo' && tasks.length === 0 ? (
                    <>
                      <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">No tasks yet</p>
                      <p className="text-[10px] sm:text-xs mt-1 opacity-75">Try: "Add a task to call the dentist"</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm">No tasks here</p>
                      <p className="text-[10px] sm:text-xs mt-1 opacity-75">Drag tasks to move them</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={showAddModal || editingTask !== null}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(p => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? 'primary' : 'secondary'}
                  onClick={() => setPriority(p)}
                  className="flex-1"
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Input
            label="Due Date (optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button
              onClick={editingTask ? handleUpdateTask : handleAddTask}
              className="flex-1"
              disabled={!title.trim()}
            >
              {editingTask ? 'Update Task' : 'Add Task'}
            </Button>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
