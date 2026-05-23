import { motion } from 'framer-motion'
import { getPhotoDisplayUrl } from '../../lib/photos'

const aspectClass = {
  tall: 'aspect-[3/4]',
  wide: 'aspect-[4/3]',
  square: 'aspect-square',
}

export default function PhotoGrid({ photos, onPhotoClick }) {
  if (!photos.length) {
    return (
      <p className="py-16 text-center text-cream/50">
        No photos found for this selection.
      </p>
    )
  }

  return (
    <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4 lg:gap-6">
      {photos.map((photo, index) => (
        <motion.button
          key={photo.id}
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
          onClick={() => onPhotoClick(index)}
          className={`group relative mb-4 w-full break-inside-avoid overflow-hidden rounded-lg border border-gold/10 bg-dark/50 transition-all duration-300 hover:scale-[1.02] hover:border-gold/60 hover:shadow-[0_0_24px_rgba(201,169,110,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:mb-5 ${aspectClass[photo.aspect] || aspectClass.square}`}
        >
          <img
            src={getPhotoDisplayUrl(photo, 600)}
            alt={photo.caption || 'Family photo'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <p className="line-clamp-2 text-left text-xs text-cream sm:text-sm">
              {photo.caption || 'Untitled'}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
