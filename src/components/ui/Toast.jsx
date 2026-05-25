import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function Toast({ message, type = 'success', isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [isOpen, onClose])

  const isSuccess = type === 'success'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed left-1/2 top-4 z-[200] -translate-x-1/2"
        >
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-2xl ${
              isSuccess
                ? 'border-gold/30 bg-gold text-dark'
                : 'border-red-400/30 bg-red-400/10 text-red-400'
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className={`ml-2 rounded-full p-1 transition-colors ${
                isSuccess
                  ? 'hover:bg-dark/20'
                  : 'hover:bg-red-400/20'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
