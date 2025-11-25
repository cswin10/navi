'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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

  function getTasksByStatus(status: TaskStatus) {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

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
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading tasks...</p>
      </div>
    )
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
              {getTasksByStatus(status).map(task => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className="cursor-move hover:border-blue-500 transition-colors"
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className="text-white font-medium text-sm sm:text-base flex-1 cursor-pointer hover:text-blue-400"
                        onClick={() => openEditModal(task)}
                      >
                        {task.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="ml-2 text-slate-400 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {task.notes && (
                      <p className="text-xs sm:text-sm text-slate-400 mb-2 line-clamp-2">
                        {task.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant={task.priority} className="text-[10px] sm:text-xs">{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</Badge>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.due_date)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {getTasksByStatus(status).length === 0 && (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <p className="text-xs sm:text-sm">No tasks in this column</p>
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
