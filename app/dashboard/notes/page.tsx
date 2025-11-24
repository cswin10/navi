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
      console.error('Error loading notes:', error)
      setToast({ message: 'Failed to load notes', type: 'error' })
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
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await (supabase
        .from('notes') as any)
        .insert({
          user_id: user.id,
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          folder: newNoteFolder.trim(),
        })

      if (error) throw error

      setToast({ message: 'Note created successfully!', type: 'success' })
      setShowCreateModal(false)
      setNewNoteTitle('')
      setNewNoteContent('')
      setNewNoteFolder('')
      loadNotes()
    } catch (error: any) {
      console.error('Error creating note:', error)
      setToast({ message: 'Failed to create note', type: 'error' })
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
      console.error('Error updating note:', error)
      setToast({ message: 'Failed to update note', type: 'error' })
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
      console.error('Error deleting note:', error)
      setToast({ message: 'Failed to delete note', type: 'error' })
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Notes</h1>
          <p className="text-slate-400">Capture your thoughts and ideas</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Folders and Notes */}
      <div className="grid grid-cols-12 gap-6">
        {/* Folders Sidebar */}
        <div className="col-span-3">
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
        <div className="col-span-9">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchQuery ? 'No notes match your search' : 'No notes yet. Create one to get started!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:border-blue-500/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                          {note.title}
                        </h3>
                        {note.folder && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Folder className="w-3 h-3" />
                            <span>{note.folder}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => openEditModal(note)}
                          className="text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm line-clamp-3 mb-3">
                      {note.content}
                    </p>
                    <p className="text-xs text-slate-500">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingNote ? 'Edit Note' : 'Create Note'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
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
