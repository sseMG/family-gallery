import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  photoPreview = null,
}) {
  // Close on escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="overflow-hidden rounded-2xl border border-gold/20 bg-dark shadow-2xl">
              {/* Header with icon */}
              <div className="relative border-b border-gold/10 bg-gradient-to-b from-gold/5 to-transparent p-6 text-center">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-full p-1 text-cream/40 transition-colors hover:text-cream"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-400/30 bg-red-400/10">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>

                <h2 className="font-serif text-xl text-cream">{title}</h2>
              </div>

              {/* Photo preview if provided */}
              {photoPreview && (
                <div className="border-b border-gold/10 p-4">
                  <div className="relative mx-auto aspect-video w-full max-w-[200px] overflow-hidden rounded-lg">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <p className="text-center text-sm leading-relaxed text-cream/70">
                  {description}
                </p>

                {/* Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 rounded-lg border border-gold/30 bg-transparent px-4 py-3 text-sm font-medium text-cream transition-colors hover:border-gold hover:bg-gold/5 disabled:opacity-50"
                  >
                    {cancelText}
                  </button>

                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-red-400/20 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/30 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      confirmText
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
