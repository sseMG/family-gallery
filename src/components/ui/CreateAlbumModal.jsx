import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const inputClass =
  'w-full rounded-sm border border-gold/20 bg-dark px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30'

export default function AlbumFormModal({ open, onClose, onSubmit, album = null }) {
  const isEdit = Boolean(album)
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open) {
      if (album) {
        setTitle(album.title || '')
        setYear(album.year != null ? String(album.year) : String(new Date().getFullYear()))
        setDescription(album.description || '')
      } else {
        setTitle('')
        setYear(String(new Date().getFullYear()))
        setDescription('')
      }
      setStatus('idle')
      setMessage('')
    }
  }, [open, album])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setStatus('error')
      setMessage('Album title is required.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      await onSubmit({
        title: title.trim(),
        year: year ? Number(year) : null,
        description: description.trim(),
      })
      setStatus('success')
      setMessage(isEdit ? 'Album updated.' : 'Album created.')
      setTimeout(onClose, 1000)
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Failed to save album.')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={status === 'loading' ? undefined : onClose}
            aria-label="Close"
          />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-xl border border-gold/20 bg-dark p-6 shadow-2xl"
            initial={{ scale: 0.95, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl text-gold">{isEdit ? 'Edit Album' : 'New Album'}</h2>
              <button
                type="button"
                onClick={onClose}
                disabled={status === 'loading'}
                className="text-cream/60 hover:text-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-gold/80">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Christmas 2024"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-gold/80">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-gold/80">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Optional notes about this album"
                />
              </div>

              {status === 'success' && (
                <p className="flex items-center gap-2 text-sm text-gold">
                  <CheckCircle className="h-4 w-4" />
                  {message}
                </p>
              )}
              {status === 'error' && (
                <p className="flex items-center gap-2 text-sm text-red-400/90" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded border border-gold/40 bg-gold/15 py-3 text-sm font-semibold uppercase tracking-widest text-gold hover:bg-gold/25 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : isEdit ? (
                  'Save Changes'
                ) : (
                  'Create Album'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
