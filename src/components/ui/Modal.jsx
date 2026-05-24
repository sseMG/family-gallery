import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle, AlertCircle, Loader2, Trash2, Edit3 } from 'lucide-react'
import { usePhotos } from '../../hooks/usePhotos'
import { useAlbums } from '../../hooks/useAlbums'
import PhotoEditModal from './PhotoEditModal'

const inputClass =
  'w-full rounded-sm border border-gold/20 bg-dark px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30'

const cleanName = (name) =>
  name
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const inferYear = (file) => {
  const fromName = file.name.match(/(?:19|20)\d{2}/)?.[0]
  if (fromName) return fromName
  const modified = new Date(file.lastModified)
  if (!Number.isNaN(modified.getTime())) return String(modified.getFullYear())
  return ''
}

const toItems = (picked) =>
  Array.from(picked)
    .filter((file) => file.type.startsWith('image/'))
    .map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'queued',
      error: '',
    }))

export default function Modal({ open, onClose, onSuccess }) {
  const { uploadPhoto } = usePhotos()
  const { albums, fetchAlbums } = useAlbums()
  const fileInputRef = useRef(null)

  const [items, setItems] = useState([])
  const [captionMode, setCaptionMode] = useState('filename')
  const [caption, setCaption] = useState('')
  const [year, setYear] = useState('')
  const [location, setLocation] = useState('')
  const [albumId, setAlbumId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)

  const uploadedCount = items.filter((item) => item.status === 'done').length
  const failedCount = items.filter((item) => item.status === 'error').length
  const activeItem = items.find((item) => item.status === 'uploading')
  const hasUploads = uploadedPhotos.length > 0

  const resetForm = useCallback(() => {
    setItems((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview))
      return []
    })
    setCaptionMode('filename')
    setCaption('')
    setYear('')
    setLocation('')
    setAlbumId('')
    setStatus('idle')
    setMessage('')
    setDragOver(false)
    setUploadedPhotos([])
    setShowEditModal(false)
  }, [])

  useEffect(() => {
    if (open) fetchAlbums()
  }, [open, fetchAlbums])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && status !== 'uploading') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, status])

  const pickFiles = (picked) => {
    const next = toItems(picked ?? [])
    if (next.length === 0) {
      setStatus('error')
      setMessage('Please choose image files.')
      return
    }

    setItems((prev) => [...prev, ...next])
    setYear((current) => current || inferYear(next[0].file))
    setStatus('idle')
    setMessage('')
  }

  const removeItem = (id) => {
    setItems((prev) => {
      const removed = prev.find((item) => item.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter((item) => item.id !== id)
    })
  }

  const clearItems = () => {
    setItems((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview))
      return []
    })
    setStatus('idle')
    setMessage('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    pickFiles(e.dataTransfer.files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      setStatus('error')
      setMessage('Drop or select photos to upload.')
      return
    }

    setStatus('uploading')
    setMessage('')

    let successful = 0
    let failed = 0
    const newlyUploaded = []

    for (const item of items) {
      if (item.status === 'done') continue

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: 'uploading', progress: 0, error: '' }
            : entry,
        ),
      )

      try {
        const uploadedPhoto = await uploadPhoto(
          item.file,
          {
            caption:
              captionMode === 'custom' && caption.trim()
                ? caption.trim()
                : cleanName(item.file.name),
            year: year ? Number(year) : null,
            location: location.trim(),
            album_id: albumId || null,
          },
          (nextProgress) => {
            setItems((prev) =>
              prev.map((entry) =>
                entry.id === item.id ? { ...entry, progress: nextProgress } : entry,
              ),
            )
          },
        )

        successful += 1
        newlyUploaded.push(uploadedPhoto)
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, status: 'done', progress: 100 } : entry,
          ),
        )
      } catch (err) {
        failed += 1
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: 'error',
                  error: err.message || 'Upload failed.',
                }
              : entry,
          ),
        )
      }
    }

    onSuccess?.()

    if (failed > 0) {
      setStatus('error')
      setMessage(`${successful} uploaded, ${failed} failed. You can retry the failed photos.`)
      return
    }

    // Store uploaded photos for editing
    if (newlyUploaded.length > 0) {
      setUploadedPhotos(newlyUploaded)
      setStatus('success')
      setMessage(`${successful} ${successful === 1 ? 'photo' : 'photos'} uploaded successfully. You can now edit their details.`)
    } else {
      setStatus('success')
      setMessage(`${successful} ${successful === 1 ? 'photo' : 'photos'} uploaded successfully.`)
      setTimeout(() => {
        onClose()
      }, 1400)
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
          >
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={status === 'uploading' ? undefined : onClose}
              aria-label="Close"
            />

            <motion.div
              className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-gold/20 bg-dark shadow-2xl shadow-black/50"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4 sm:px-6">
                <div>
                  <h2
                    id="upload-modal-title"
                    className="font-serif text-xl text-gold sm:text-2xl"
                  >
                    Memory Drop
                  </h2>
                  <p className="mt-1 text-xs text-cream/45">
                    Drop a batch now. Add richer details later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={status === 'uploading'}
                  className="rounded-full border border-gold/25 p-1.5 text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-all duration-300 ${
                    dragOver
                      ? 'border-gold bg-gold/10'
                      : 'border-gold/25 bg-gold/5 hover:border-gold/50 hover:bg-gold/10'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => pickFiles(e.target.files)}
                  />
                  <Upload className="mb-3 h-10 w-10 text-gold/70" />
                  <p className="text-center text-sm text-cream/70">
                    Drag and drop photos here, or click to browse
                  </p>
                  <p className="mt-2 text-center text-xs text-cream/35">
                    {items.length > 0
                      ? `${items.length} ${items.length === 1 ? 'photo' : 'photos'} ready`
                      : 'You can select many images at once'}
                  </p>
                </div>

                {items.length > 0 && (
                  <div className="rounded-lg border border-gold/10 bg-black/15 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-wider text-gold/70">
                        Upload queue
                      </p>
                      <button
                        type="button"
                        onClick={clearItems}
                        disabled={status === 'uploading'}
                        className="text-xs text-cream/45 transition-colors hover:text-gold disabled:opacity-40"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="group relative overflow-hidden rounded-lg border border-gold/10 bg-dark/70"
                        >
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            className="aspect-square w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1.5">
                            <p className="truncate text-[11px] text-cream/75">{item.file.name}</p>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-gold/10">
                              <div
                                className={`h-full ${
                                  item.status === 'error' ? 'bg-red-400' : 'bg-gold'
                                }`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                          {item.status === 'uploading' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                              <Loader2 className="h-6 w-6 animate-spin text-gold" />
                            </div>
                          )}
                          {item.status === 'done' && (
                            <div className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-gold">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                          {item.status === 'error' && (
                            <div className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-red-400">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                          )}
                          {status !== 'uploading' && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="absolute left-2 top-2 rounded-full bg-black/70 p-1 text-cream/70 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                              aria-label={`Remove ${item.file.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                      Caption style
                    </label>
                    <select
                      value={captionMode}
                      onChange={(e) => setCaptionMode(e.target.value)}
                      className={inputClass}
                    >
                      <option value="filename">Use each filename</option>
                      <option value="custom">Use one caption for all</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                      Shared caption
                    </label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      disabled={captionMode !== 'custom'}
                      className={inputClass}
                      placeholder="A moment we will never forget"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                      Year taken
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={inputClass}
                      placeholder="Edit later"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={inputClass}
                      placeholder="City, place"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                      Album
                    </label>
                    <select
                      value={albumId}
                      onChange={(e) => setAlbumId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Unorganized</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>
                          {album.title} ({album.year})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {status === 'uploading' && (
                  <div className="flex items-center gap-3 rounded-lg border border-gold/10 bg-gold/5 p-3 text-sm text-cream/70">
                    <Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden />
                    Uploading {activeItem?.file.name || 'photos'}… {uploadedCount} of {items.length} complete
                  </div>
                )}

                {status === 'success' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gold">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      {message}
                    </div>
                    {hasUploads && (
                      <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="w-full rounded border border-gold/40 bg-gold/15 py-3 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:bg-gold/25"
                      >
                        <Edit3 className="inline h-4 w-4 mr-2" />
                        Edit Photo Details
                      </button>
                    )}
                  </div>
                )}

                {status === 'error' && message && (
                  <div className="flex items-center gap-2 text-sm text-red-400/90" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'uploading'}
                  className="w-full rounded border border-gold/40 bg-gold/15 py-3 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'uploading'
                    ? 'Uploading…'
                    : items.length > 0
                      ? `Upload ${items.length} ${items.length === 1 ? 'Photo' : 'Photos'}`
                      : 'Choose Photos'}
                </button>

                {failedCount > 0 && (
                  <p className="text-center text-xs text-cream/40">
                    Failed photos stay in the queue so you can upload again.
                  </p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PhotoEditModal
        photos={uploadedPhotos}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false)
          setUploadedPhotos([])
          onClose()
        }}
      />
    </>
  )
}
