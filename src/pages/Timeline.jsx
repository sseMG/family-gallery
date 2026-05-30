import { useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhotoGridSkeleton } from '../components/ui/Skeleton'
import { usePhotos } from '../hooks/usePhotos'
import { getPhotoDisplayUrl, groupPhotosByYear } from '../lib/photos'

function TimelineYear({ year, photos }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  if (!photos.length) return null

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative"
    >
      <div className="mb-5 flex items-center gap-4 sm:mb-6">
        <h2 className="font-serif text-3xl font-bold text-gold sm:text-4xl">{year}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent" />
        <span className="text-xs uppercase tracking-widest text-cream/40">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </span>
      </div>

      <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:gap-5 sm:px-8 lg:-mx-10 lg:px-10">
        {photos.map((photo, i) => (
          <motion.figure
            key={photo.id}
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: 0.45, delay: 0.08 + i * 0.06 }}
            className="w-[220px] shrink-0 sm:w-[260px] lg:w-[300px]"
          >
            <div className="overflow-hidden rounded-lg border border-gold/15 transition-colors duration-300 hover:border-gold/50 hover:shadow-[0_0_20px_rgba(201,169,110,0.15)]">
              <img
                src={getPhotoDisplayUrl(photo, 500)}
                alt={photo.caption || 'Family photo'}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <figcaption className="mt-2 line-clamp-2 text-sm text-cream/70">
              {photo.caption && !/^[\d\s]+n?$/.test(photo.caption) ? photo.caption : 'Untitled'}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </motion.section>
  )
}

export default function Timeline() {
  const { photos, loading, fetchPhotos } = usePhotos()
  const sections = groupPhotosByYear(photos, true).filter((s) => s.photos.length > 0)

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  return (
    <main className="min-h-screen bg-dark">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-48 bg-gradient-to-b from-gold/5 to-transparent sm:top-[4.5rem]" />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-16"
        >
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Silva Family</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-gold sm:text-4xl lg:text-5xl">
            Timeline
          </h1>
          <p className="mt-3 max-w-xl text-sm text-cream/60 sm:text-base">
            Our story year by year — scroll through the moments that shaped us.
          </p>
        </motion.header>

        {loading ? (
          <PhotoGridSkeleton count={6} />
        ) : sections.length === 0 ? (
          <p className="py-16 text-center text-cream/50">No photos in the timeline yet.</p>
        ) : (
          <div className="relative space-y-14 border-l border-gold/20 pl-8 sm:space-y-20 sm:pl-10">
            {sections.map(({ year, photos: yearPhotos }) => (
              <div key={year} className="relative">
                <div
                  className="absolute -left-[calc(2rem+5px)] top-3 h-2.5 w-2.5 rounded-full border-2 border-gold bg-dark sm:-left-[calc(2.5rem+5px)]"
                  aria-hidden
                />
                <TimelineYear year={year} photos={yearPhotos} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
