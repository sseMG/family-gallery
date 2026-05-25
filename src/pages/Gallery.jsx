import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FolderOpen, Trash2 } from 'lucide-react'
import PhotoGrid from '../components/gallery/PhotoGrid'
import Lightbox from '../components/gallery/Lightbox'
import { PhotoGridSkeleton } from '../components/ui/Skeleton'
import { usePhotos } from '../hooks/usePhotos'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store'
import { getGalleryYears } from '../lib/photos'
import MoveToAlbumModal from '../components/gallery/MoveToAlbumModal'
import Toast from '../components/ui/Toast'

export default function Gallery() {
  const { user, isAdmin } = useAuth()
  const { photos, loading, error, fetchPhotos, fetchPhotosByYear, deletePhoto } = usePhotos()
  const setUploadModalOpen = useStore((s) => s.setUploadModalOpen)
  const [year, setYear] = useState('All')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  // Bulk selection state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [toast, setToast] = useState(null)

  const enterSelectMode = useCallback((photoId) => {
    setSelectMode(true)
    setSelectedIds(new Set([photoId]))
  }, [])

  const exitSelectMode = useCallback(() => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  const togglePhotoSelection = useCallback((photoId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) {
        next.delete(photoId)
      } else {
        next.add(photoId)
      }
      return next
    })
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm(`Delete ${selectedIds.size} photos? This cannot be undone.`)) return

    let successCount = 0
    let failCount = 0

    for (const id of selectedIds) {
      try {
        await deletePhoto(id)
        successCount++
      } catch {
        failCount++
      }
    }

    if (failCount === 0) {
      setToast({ message: `${successCount} photos deleted`, type: 'success' })
    } else {
      setToast({ message: `${successCount} deleted, ${failCount} failed`, type: 'error' })
    }

    exitSelectMode()
  }, [selectedIds, deletePhoto, exitSelectMode])

  const handleMoveSuccess = useCallback((count, albumName) => {
    setToast({ message: `${count} photos moved to ${albumName}`, type: 'success' })
    exitSelectMode()
    fetchPhotos()
  }, [exitSelectMode, fetchPhotos])

  const yearFilters = useMemo(() => {
    const fromData = getGalleryYears(photos)
    if (fromData.length > 1) return fromData
    return [2020, 2021, 2022, 2023, 2024, 'All']
  }, [photos])

  useEffect(() => {
    if (year === 'All') fetchPhotos()
    else fetchPhotosByYear(year)
  }, [year, fetchPhotos, fetchPhotosByYear])

  return (
    <main className="min-h-screen bg-dark">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-48 bg-gradient-to-b from-gold/5 to-transparent sm:top-[4.5rem]" />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Silva Family</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-gold sm:text-4xl lg:text-5xl">
              {selectMode ? `${selectedIds.size} photos selected` : 'Gallery'}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-cream/60 sm:text-base">
              {selectMode
                ? 'Long press or click to select photos'
                : 'Browse our memories by year — click any photo to view it full screen.'}
            </p>
          </div>

          <div className="flex gap-3">
            {selectMode && (
              <button
                type="button"
                onClick={exitSelectMode}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded border border-gold/40 bg-dark px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/10 sm:self-auto"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
            {isAdmin && user && !selectMode && (
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded border border-gold/40 bg-gold/15 px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/25 sm:self-auto"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            )}
          </div>
        </motion.header>

        {error && (
          <p className="mb-6 rounded border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {!selectMode && (
          <div className="mb-8 flex flex-wrap gap-2 sm:mb-10 sm:gap-3">
            {yearFilters.map((y) => {
              const active = year === y
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setYear(y)
                    setLightboxIndex(null)
                  }}
                  className={`rounded border px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                    active
                      ? 'border-gold bg-gold/15 text-gold shadow-[0_0_16px_rgba(201,169,110,0.2)]'
                      : 'border-gold/20 text-cream/60 hover:border-gold/40 hover:text-gold'
                  }`}
                >
                  {y}
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <PhotoGridSkeleton />
        ) : (
          <PhotoGrid
            photos={photos}
            onPhotoClick={(index) => !selectMode && setLightboxIndex(index)}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onSelectPhoto={togglePhotoSelection}
            onEnterSelectMode={enterSelectMode}
          />
        )}
      </div>

      <Lightbox
        photos={photos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={() => setLightboxIndex((i) => (i > 0 ? i - 1 : i))}
        onNext={() =>
          setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : i))
        }
      />

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gold/20 bg-dark/80 px-4 py-3 shadow-2xl backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setShowMoveModal(true)}
              className="flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/25"
            >
              <FolderOpen className="h-4 w-4" />
              Move to Album
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-full bg-red-400/15 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/25"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={exitSelectMode}
              className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-sm font-medium text-cream transition-colors hover:border-gold hover:text-gold"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move to Album Modal */}
      <MoveToAlbumModal
        open={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        selectedIds={selectedIds}
        onSuccess={handleMoveSuccess}
      />

      {/* Toast */}
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'success'}
        isOpen={!!toast}
        onClose={() => setToast(null)}
      />
    </main>
  )
}
