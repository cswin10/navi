'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { FileText, Folder, Search, Plus, Trash2, Edit2, X } from 'lucide-react'

interface Note {
  id: string
  user_id: string
  title: string
  content: string
  folder: string
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteFolder, setNewNoteFolder] = useState('')

  useEffect(() => {
    loadNotes()

    // Check for ?add=true to auto-open modal (client-side only)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('add') === 'true') {
        setShowCreateModal(true)
        window.history.replaceState({}, '', '/dashboard/notes')
      }
    }
  }, [])

  useEffect(() => {
    filterNotes()
  }, [notes, selectedFolder, searchQuery])

  async function loadNotes() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await (supabase
        .from('notes') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotes(data || [])
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || String(error) || 'Failed to load notes'
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function filterNotes() {
    let filtered = notes

    // Filter by folder
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(note => note.folder === selectedFolder)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      )
    }

    setFilteredNotes(filtered)
  }

  function getFolders(): string[] {
    const folders = Array.from(new Set(notes.map(note => note.folder).filter(f => f)))
    return folders.sort()
  }

  async function handleCreateNote() {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      setToast({ message: 'Title and content are required', type: 'error' })
      return
    }

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`)
      }

      if (!user) {
        setToast({ message: 'You must be logged in to create notes', type: 'error' })
        return
      }

      const noteData = {
        user_id: user.id,
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        folder: newNoteFolder.trim() || null,
      }

      const { data, error } = await (supabase
        .from('notes') as any)
        .insert(noteData)
        .select()

      if (error) {
        throw error
      }

      setToast({ message: 'Note created successfully!', type: 'success' })
      setShowCreateModal(false)
      setNewNoteTitle('')
      setNewNoteContent('')
      setNewNoteFolder('')
      loadNotes()
    } catch (error: any) {
      let errorMessage = 'Failed to create note'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error_description) {
        errorMessage = error.error_description
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error) {
        try {
          errorMessage = JSON.stringify(error)
        } catch {
          errorMessage = String(error)
        }
      }

      setToast({ message: errorMessage, type: 'error' })
    }
  }

  async function handleUpdateNote() {
    if (!editingNote || !newNoteTitle.trim() || !newNoteContent.trim()) {
      setToast({ message: 'Title and content are required', type: 'error' })
      return
    }

    try {
      const supabase = createClient()

      const { error } = await (supabase
        .from('notes') as any)
        .update({
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          folder: newNoteFolder.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNote.id)

      if (error) throw error

      setToast({ message: 'Note updated successfully!', type: 'success' })
      setEditingNote(null)
      setNewNoteTitle('')
      setNewNoteContent('')
      setNewNoteFolder('')
      loadNotes()
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || String(error) || 'Failed to update note'
      setToast({ message: errorMessage, type: 'error' })
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const supabase = createClient()

      const { error } = await (supabase
        .from('notes') as any)
        .delete()
        .eq('id', noteId)

      if (error) throw error

      setToast({ message: 'Note deleted successfully!', type: 'success' })
      loadNotes()
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || String(error) || 'Failed to delete note'
      setToast({ message: errorMessage, type: 'error' })
    }
  }

  function openEditModal(note: Note) {
    setEditingNote(note)
    setNewNoteTitle(note.title)
    setNewNoteContent(note.content)
    setNewNoteFolder(note.folder)
  }

  function closeModal() {
    setShowCreateModal(false)
    setEditingNote(null)
    setNewNoteTitle('')
    setNewNoteContent('')
    setNewNoteFolder('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading notes...</p>
      </div>
    )
  }

  const folders = getFolders()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Notes</h1>
          <p className="text-sm sm:text-base text-slate-400">Capture your thoughts and ideas</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto text-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-9 sm:pl-10 text-sm"
          />
        </div>
      </div>

      {/* Mobile Folder Selector */}
      <div className="lg:hidden">
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Notes ({notes.length})</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder} ({notes.filter(n => n.folder === folder).length})
            </option>
          ))}
        </select>
      </div>

      {/* Folders and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Folders Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Folders</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedFolder === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>All Notes</span>
                  <span className="ml-auto text-xs opacity-75">{notes.length}</span>
                </button>

                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedFolder === folder
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                    <span className="truncate">{folder}</span>
                    <span className="ml-auto text-xs opacity-75">
                      {notes.filter(n => n.folder === folder).length}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Grid */}
        <div className="lg:col-span-9">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="py-8 sm:py-12 text-center">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-slate-400">
                  {searchQuery ? 'No notes match your search' : 'No notes yet. Create one to get started!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:border-blue-500/50 transition-colors">
                  <CardContent className="p-4 sm:pt-6">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                          {note.title}
                        </h3>
                        {note.folder && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400">
                            <Folder className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span>{note.folder}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 ml-2">
                        <button
                          onClick={() => openEditModal(note)}
                          className="text-slate-400 hover:text-blue-400 active:text-blue-500 transition-colors p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-slate-400 hover:text-red-400 active:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm line-clamp-3 mb-2 sm:mb-3">
                      {note.content}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingNote) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {editingNote ? 'Edit Note' : 'Create Note'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white active:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <Input
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note title"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Folder (optional)
                </label>
                <Input
                  value={newNoteFolder}
                  onChange={(e) => setNewNoteFolder(e.target.value)}
                  placeholder="e.g. Work, Personal, Ideas"
                  list="folders"
                />
                <datalist id="folders">
                  {folders.map((folder) => (
                    <option key={folder} value={folder} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={12}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={editingNote ? handleUpdateNote : handleCreateNote}
                  className="flex-1"
                >
                  {editingNote ? 'Update Note' : 'Create Note'}
                </Button>
                <Button
                  onClick={closeModal}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
