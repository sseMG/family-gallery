import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import PhotoGrid from '../components/gallery/PhotoGrid'
import Lightbox from '../components/gallery/Lightbox'
import UploadModal from '../components/ui/Modal'
import { PhotoGridSkeleton } from '../components/ui/Skeleton'
import { usePhotos } from '../hooks/usePhotos'
import { useAuth } from '../hooks/useAuth'
import { getGalleryYears } from '../lib/photos'

export default function Gallery() {
  const { user, isAdmin } = useAuth()
  const { photos, loading, fetchPhotos, fetchPhotosByYear } = usePhotos()
  const [year, setYear] = useState('All')
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const yearFilters = useMemo(() => {
    const fromData = getGalleryYears(photos)
    if (fromData.length > 1) return fromData
    return [2020, 2021, 2022, 2023, 2024, 'All']
  }, [photos])

  useEffect(() => {
    if (year === 'All') {
      fetchPhotos()
    } else {
      fetchPhotosByYear(year)
    }
  }, [year, fetchPhotos, fetchPhotosByYear])

  const handleUploadSuccess = () => {
    if (year === 'All') fetchPhotos()
    else fetchPhotosByYear(year)
  }

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
              Gallery
            </h1>
            <p className="mt-3 max-w-xl text-sm text-cream/60 sm:text-base">
              Browse our memories by year — click any photo to view it full screen.
            </p>
          </div>

          {isAdmin && user && (
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded border border-gold/40 bg-gold/15 px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/25 sm:self-auto"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          )}
        </motion.header>

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

        {loading ? (
          <PhotoGridSkeleton />
        ) : (
          <PhotoGrid
            photos={photos}
            onPhotoClick={(index) => setLightboxIndex(index)}
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

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </main>
  )
}
