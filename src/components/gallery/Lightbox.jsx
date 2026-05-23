import { useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getPhotoDisplayUrl } from '../../lib/photos'

export default function Lightbox({
  photos,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}) {
  const photo = photos[activeIndex]
  const hasPrev = activeIndex > 0
  const hasNext = activeIndex < photos.length - 1

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext) onNext()
    },
    [onClose, onPrev, onNext, hasPrev, hasNext],
  )

  useEffect(() => {
    if (activeIndex == null) return
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, handleKeyDown])

  return (
    <AnimatePresence>
      {photo && activeIndex != null && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close lightbox"
          />

          <motion.div
            className="relative z-10 flex w-full max-w-5xl flex-col items-center"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-2 right-0 z-20 rounded-full border border-gold/30 bg-dark/80 p-2 text-cream transition-colors hover:border-gold hover:text-gold sm:-right-2 sm:-top-10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {hasPrev && (
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gold/25 bg-dark/90 p-2.5 text-gold transition-all hover:border-gold hover:bg-gold/10 sm:-left-14"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {hasNext && (
              <button
                type="button"
                onClick={onNext}
                className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gold/25 bg-dark/90 p-2.5 text-gold transition-all hover:border-gold hover:bg-gold/10 sm:-right-14"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            <div className="overflow-hidden rounded-lg border border-gold/20 shadow-2xl shadow-black/60">
              <img
                src={getPhotoDisplayUrl(photo, 1400)}
                alt={photo.caption || 'Family photo'}
                className="max-h-[70vh] w-full object-contain bg-dark"
              />
            </div>

            <div className="mt-5 text-center">
              <p className="font-serif text-lg text-cream sm:text-xl">
                {photo.caption || 'Untitled'}
              </p>
              <p className="mt-1 text-sm tracking-widest text-gold">
                {photo.year}
                {photo.location ? ` · ${photo.location}` : ''}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
