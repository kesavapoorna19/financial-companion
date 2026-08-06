import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import notesService from '../../services/notesService'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

export default function EditNoteModal({ open, onClose, note, onSaved }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setText(note?.note || '')
      setError(null)
    }
  }, [open, note])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await notesService.updateNote(note.id, note.type, text.trim())
      toast.success('Note updated')
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to update note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit note — ${note?.title || ''}`}
    >
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your note here…"
        autoFocus
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
      />

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !text.trim()}>
          {saving ? <Spinner className="h-4 w-4" /> : <><Save size={16} /> Save</>}
        </Button>
      </div>
    </Modal>
  )
}
