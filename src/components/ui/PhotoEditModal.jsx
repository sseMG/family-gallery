import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { usePhotos } from '../../hooks/usePhotos'
import { useAlbums } from '../../hooks/useAlbums'
import { useStore } from '../../store'

const inputClass =
  'w-full rounded-sm border border-gold/20 bg-dark px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30'

const selectClass =
  'w-full rounded-sm border border-gold/20 bg-dark px-4 py-3 text-cream outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30'

export default function PhotoEditModal({ photos, open, onClose, onSuccess }) {
  const { updatePhoto, fetchPhotos } = usePhotos()
  const { albums, fetchAlbums } = useAlbums()
  const storePhotos = useStore((s) => s.photos)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editingPhotos, setEditingPhotos] = useState([])
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const currentPhoto = editingPhotos[currentIndex]

  // Initialize editing photos ONLY when modal opens (not on every store change)
  useEffect(() => {
    if (open && photos?.length && !initialized) {
      // Get latest from store if available
      const latestPhotos = photos.map(photo => {
        const fromStore = storePhotos.find(p => p.id === photo.id)
        const latest = fromStore || photo
        return {
          ...latest,
          originalData: {
            caption: latest.caption || '',
            year: latest.year,
            location: latest.location || '',
            album_id: latest.album_id
          }
        }
      })
      setEditingPhotos(latestPhotos)
      setCurrentIndex(0)
      setHasChanges(false)
      setInitialized(true)
      fetchAlbums()
    }
    if (!open) {
      setInitialized(false)
    }
  }, [open, photos, fetchAlbums]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check for changes
  useEffect(() => {
    if (!currentPhoto) return
    const { caption, year, location, album_id, originalData } = currentPhoto
    const changed = 
      caption !== originalData.caption ||
      year !== originalData.year ||
      location !== originalData.location ||
      album_id !== originalData.album_id
    setHasChanges(changed)
  }, [currentPhoto])

  const updateCurrentPhoto = useCallback((field, value) => {
    setEditingPhotos(prev => prev.map((photo, index) => 
      index === currentIndex ? { ...photo, [field]: value } : photo
    ))
  }, [currentIndex])

  const resetCurrentPhoto = useCallback(() => {
    if (!currentPhoto) return
    setEditingPhotos(prev => prev.map((photo, index) => 
      index === currentIndex ? { ...photo, ...currentPhoto.originalData } : photo
    ))
  }, [currentIndex, currentPhoto])

  const saveCurrentPhoto = useCallback(async () => {
    if (!currentPhoto || !hasChanges) return

    setStatus('saving')
    setMessage('')

    try {
      await updatePhoto(currentPhoto.id, {
        caption: currentPhoto.caption,
        year: currentPhoto.year,
        location: currentPhoto.location,
        album_id: currentPhoto.album_id || null
      })

      // Update original data to reflect saved state
      setEditingPhotos(prev => prev.map((photo, index) => 
        index === currentIndex ? {
          ...photo,
          originalData: {
            caption: photo.caption,
            year: photo.year,
            location: photo.location,
            album_id: photo.album_id
          }
        } : photo
      ))

      setStatus('success')
      setMessage('Photo updated successfully!')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Failed to update photo')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [currentPhoto, hasChanges, updatePhoto, currentIndex])

  const saveAllChanges = useCallback(async () => {
    const changedPhotos = editingPhotos.filter((photo, index) => {
      const { caption, year, location, album_id, originalData } = photo
      return caption !== originalData.caption ||
             year !== originalData.year ||
             location !== originalData.location ||
             album_id !== originalData.album_id
    })

    if (changedPhotos.length === 0) {
      onClose()
      return
    }

    setStatus('saving')
    setMessage(`Saving ${changedPhotos.length} photo${changedPhotos.length === 1 ? '' : 's'}...`)

    try {
      await Promise.all(changedPhotos.map(photo =>
        updatePhoto(photo.id, {
          caption: photo.caption,
          year: photo.year,
          location: photo.location,
          album_id: photo.album_id || null
        })
      ))

      setStatus('success')
      setMessage(`${changedPhotos.length} photo${changedPhotos.length === 1 ? '' : 's'} updated successfully!`)
      onSuccess?.()
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Failed to save some photos')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [editingPhotos, updatePhoto, onClose, onSuccess])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }, [currentIndex])

  const goToNext = useCallback(() => {
    if (currentIndex < editingPhotos.length - 1) setCurrentIndex(currentIndex + 1)
  }, [currentIndex, editingPhotos.length])

  if (!open || !currentPhoto) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={status === 'saving' ? undefined : onClose}
            aria-label="Close"
          />

          <motion.div
            className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-gold/20 bg-dark shadow-2xl shadow-black/50"
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
                  Edit Photo Details
                </h2>
                <p className="mt-1 text-xs text-cream/45">
                  Photo {currentIndex + 1} of {editingPhotos.length}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={status === 'saving'}
                className="rounded-full border border-gold/25 p-1.5 text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 sm:p-6">
              {/* Image Preview */}
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg border border-gold/10 bg-black/30">
                  <img
                    src={currentPhoto.url}
                    alt={currentPhoto.caption || 'Photo'}
                    className="w-full object-contain"
                    style={{ maxHeight: '500px' }}
                  />
                </div>

                {/* Navigation */}
                {editingPhotos.length > 1 && (
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={goToPrevious}
                      disabled={currentIndex === 0}
                      className="flex items-center gap-2 rounded border border-gold/20 px-3 py-2 text-sm text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {editingPhotos.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentIndex(index)}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            index === currentIndex ? 'bg-gold' : 'bg-gold/30'
                          }`}
                          aria-label={`Go to photo ${index + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={goToNext}
                      disabled={currentIndex === editingPhotos.length - 1}
                      className="flex items-center gap-2 rounded border border-gold/20 px-3 py-2 text-sm text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Form */}
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                    Caption
                  </label>
                  <textarea
                    value={currentPhoto.caption || ''}
                    onChange={(e) => updateCurrentPhoto('caption', e.target.value)}
                    className={inputClass}
                    rows={3}
                    placeholder="Add a meaningful caption..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                      Year Taken
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      value={currentPhoto.year || ''}
                      onChange={(e) => updateCurrentPhoto('year', e.target.value ? Number(e.target.value) : null)}
                      className={inputClass}
                      placeholder="2024"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                      Location
                    </label>
                    <input
                      type="text"
                      value={currentPhoto.location || ''}
                      onChange={(e) => updateCurrentPhoto('location', e.target.value)}
                      className={inputClass}
                      placeholder="City, place"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                    Album
                  </label>
                  <select
                    value={currentPhoto.album_id || ''}
                    onChange={(e) => updateCurrentPhoto('album_id', e.target.value || null)}
                    className={selectClass}
                  >
                    <option value="">Unorganized</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title} ({album.year})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={resetCurrentPhoto}
                    disabled={status === 'saving' || !hasChanges}
                    className="flex items-center gap-2 rounded border border-gold/20 px-4 py-2 text-sm text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                  
                  <button
                    type="button"
                    onClick={saveCurrentPhoto}
                    disabled={status === 'saving' || !hasChanges}
                    className="flex items-center gap-2 rounded border border-gold bg-gold/15 px-4 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === 'saving' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save This Photo
                  </button>
                </div>

                {/* Status Messages */}
                {status === 'success' && (
                  <div className="text-sm text-gold">
                    {message}
                  </div>
                )}
                {status === 'error' && (
                  <div className="text-sm text-red-400">
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gold/15 px-5 py-4 sm:px-6">
              <p className="text-xs text-cream/45">
                {editingPhotos.filter((photo, index) => {
                  const { caption, year, location, album_id, originalData } = photo
                  return caption !== originalData.caption ||
                         year !== originalData.year ||
                         location !== originalData.location ||
                         album_id !== originalData.album_id
                }).length} photos have unsaved changes
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={status === 'saving'}
                  className="rounded border border-gold/20 px-4 py-2 text-sm text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={saveAllChanges}
                  disabled={status === 'saving'}
                  className="rounded border border-gold bg-gold/15 px-4 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'saving' ? (
                    <>
                      <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save All & Close'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
