import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { usePhotos } from '../../hooks/usePhotos'
import { useAlbums } from '../../hooks/useAlbums'

const inputClass =
  'w-full rounded-sm border border-gold/20 bg-dark px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30'

export default function Modal({ open, onClose, onSuccess }) {
  const { uploadPhoto } = usePhotos()
  const { albums, fetchAlbums } = useAlbums()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [location, setLocation] = useState('')
  const [albumId, setAlbumId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const resetForm = useCallback(() => {
    setFile(null)
    setPreview(null)
    setCaption('')
    setYear(String(new Date().getFullYear()))
    setLocation('')
    setAlbumId('')
    setProgress(0)
    setStatus('idle')
    setMessage('')
    setDragOver(false)
  }, [])

  useEffect(() => {
    if (open) fetchAlbums()
  }, [open, fetchAlbums])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && status !== 'uploading') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, status])

  const pickFile = (picked) => {
    if (!picked?.type.startsWith('image/')) {
      setStatus('error')
      setMessage('Please choose an image file.')
      return
    }
    setFile(picked)
    setStatus('idle')
    setMessage('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) pickFile(dropped)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setStatus('error')
      setMessage('Select a photo to upload.')
      return
    }

    setStatus('uploading')
    setProgress(0)
    setMessage('')

    try {
      await uploadPhoto(
        file,
        {
          caption: caption.trim(),
          year: year ? Number(year) : null,
          location: location.trim(),
          album_id: albumId || null,
        },
        setProgress,
      )
      setStatus('success')
      setMessage('Photo uploaded successfully.')
      onSuccess?.()
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Upload failed.')
    }
  }

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
          aria-labelledby="upload-modal-title"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={status === 'uploading' ? undefined : onClose}
            aria-label="Close"
          />

          <motion.div
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gold/20 bg-dark shadow-2xl shadow-black/50"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4 sm:px-6">
              <h2
                id="upload-modal-title"
                className="font-serif text-xl text-gold sm:text-2xl"
              >
                Upload Photo
              </h2>
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
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="mb-3 max-h-40 rounded object-contain"
                  />
                ) : (
                  <Upload className="mb-3 h-10 w-10 text-gold/70" />
                )}
                <p className="text-center text-sm text-cream/70">
                  Drag and drop a photo here, or click to browse
                </p>
                {file && (
                  <p className="mt-2 text-xs text-gold/80">{file.name}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80">
                  Caption
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className={inputClass}
                  placeholder="A moment we will never forget"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    required
                    className={inputClass}
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
                  <option value="">No album</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title} ({album.year})
                    </option>
                  ))}
                </select>
              </div>

              {status === 'uploading' && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />
                  <div className="w-full">
                    <div className="mb-1 flex justify-between text-xs text-cream/60">
                      <span>Uploading to Cloudinary…</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gold/10">
                      <motion.div
                        className="h-full bg-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="flex items-center gap-2 text-sm text-gold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {message}
                </div>
              )}

              {status === 'error' && (
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
                {status === 'uploading' ? 'Uploading…' : 'Upload Photo'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
