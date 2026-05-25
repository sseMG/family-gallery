import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderOpen, Plus, ImageOff } from 'lucide-react'
import { useAlbums } from '../../hooks/useAlbums'
import { supabase } from '../../lib/supabase'

export default function MoveToAlbumModal({ open, onClose, selectedIds, onSuccess }) {
  const { albums, fetchAlbums, createAlbum } = useAlbums()
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAlbumTitle, setNewAlbumTitle] = useState('')
  const [newAlbumYear, setNewAlbumYear] = useState('')

  useEffect(() => {
    if (open) fetchAlbums()
  }, [open, fetchAlbums])

  const handleMove = useCallback(async (albumId, albumName) => {
    if (selectedIds.size === 0) return

    setLoading(true)

    const { error } = await supabase
      .from('photos')
      .update({ album_id: albumId || null })
      .in('id', [...selectedIds])

    setLoading(false)

    if (error) {
      alert(`Failed to move photos: ${error.message}`)
      return
    }

    onSuccess?.(selectedIds.size, albumName || 'No Album')
    onClose()
  }, [selectedIds, onSuccess, onClose])

  const handleCreateAlbum = useCallback(async () => {
    if (!newAlbumTitle.trim()) return

    setLoading(true)
    try {
      const album = await createAlbum({
        title: newAlbumTitle.trim(),
        year: newAlbumYear ? Number(newAlbumYear) : null,
        description: null,
      })
      await handleMove(album.id, album.title)
      setShowCreateForm(false)
      setNewAlbumTitle('')
      setNewAlbumYear('')
    } catch (err) {
      alert(`Failed to create album: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [newAlbumTitle, newAlbumYear, createAlbum, handleMove])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={loading ? undefined : onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gold/20 bg-dark shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-serif text-xl text-gold sm:text-2xl">
                  Move to Album
                </h2>
                <p className="mt-1 text-xs text-cream/45">
                  {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-full border border-gold/25 p-1.5 text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6">
              {/* No Album Option */}
              <button
                type="button"
                onClick={() => handleMove(null, 'No Album')}
                disabled={loading}
                className="mb-4 flex w-full items-center gap-3 rounded-lg border border-gold/20 bg-dark/50 p-4 text-left transition-colors hover:border-gold/40 hover:bg-gold/5 disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gold/20 bg-dark">
                  <ImageOff className="h-5 w-5 text-cream/50" />
                </div>
                <div>
                  <p className="font-medium text-cream">No Album</p>
                  <p className="text-xs text-cream/50">Remove from any album</p>
                </div>
              </button>

              {/* Create New Album */}
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  disabled={loading}
                  className="mb-6 flex w-full items-center gap-3 rounded-lg border border-gold/20 bg-gold/5 p-4 text-left transition-colors hover:border-gold/40 hover:bg-gold/10 disabled:opacity-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gold/20 bg-dark">
                    <Plus className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-gold">Create New Album</p>
                    <p className="text-xs text-cream/50">Start a new collection</p>
                  </div>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 rounded-lg border border-gold/20 bg-gold/5 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                        Album Name
                      </label>
                      <input
                        type="text"
                        value={newAlbumTitle}
                        onChange={(e) => setNewAlbumTitle(e.target.value)}
                        placeholder="e.g., Christmas 2024"
                        className="w-full rounded border border-gold/20 bg-dark px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateAlbum()
                          if (e.key === 'Escape') setShowCreateForm(false)
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                        Year (optional)
                      </label>
                      <input
                        type="number"
                        value={newAlbumYear}
                        onChange={(e) => setNewAlbumYear(e.target.value)}
                        placeholder="2024"
                        min="1900"
                        max="2100"
                        className="w-full rounded border border-gold/20 bg-dark px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateAlbum()
                          if (e.key === 'Escape') setShowCreateForm(false)
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateAlbum}
                      disabled={loading || !newAlbumTitle.trim()}
                      className="flex-1 rounded bg-gold px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gold/90 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create & Move'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewAlbumTitle('')
                        setNewAlbumYear('')
                      }}
                      disabled={loading}
                      className="rounded border border-gold/30 px-4 py-2 text-sm font-medium text-cream transition-colors hover:border-gold hover:text-gold"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Albums Grid */}
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-gold/70">
                  Existing Albums
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {albums.map((album) => (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => handleMove(album.id, album.title)}
                      disabled={loading}
                      className="group relative overflow-hidden rounded-lg border border-gold/10 bg-dark/50 p-3 text-left transition-all hover:border-gold/30 disabled:opacity-50"
                    >
                      {/* Cover or placeholder */}
                      <div className="mb-3 aspect-[4/3] overflow-hidden rounded bg-dark">
                        {album.cover_url ? (
                          <img
                            src={album.cover_url}
                            alt={album.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <FolderOpen className="h-8 w-8 text-gold/30" />
                          </div>
                        )}
                      </div>
                      <p className="line-clamp-1 text-sm font-medium text-cream">
                        {album.title}
                      </p>
                      {album.year && (
                        <p className="text-xs text-cream/50">{album.year}</p>
                      )}
                      <p className="text-xs text-cream/40">
                        {album.photo_count} photo{album.photo_count !== 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                </div>

                {albums.length === 0 && (
                  <p className="py-8 text-center text-sm text-cream/50">
                    No albums yet. Create your first one above.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
