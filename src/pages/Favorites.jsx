import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import PhotoGrid from '../components/gallery/PhotoGrid'
import Lightbox from '../components/gallery/Lightbox'
import { PhotoGridSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { Link } from 'react-router-dom'

export default function Favorites() {
  const { user, isAdmin } = useAuth()
  const { fetchFavoritePhotos, fetchMyFavorites } = useFavorites()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        await fetchMyFavorites()
        const rows = await fetchFavoritePhotos()
        if (!cancelled) setPhotos(rows)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user, fetchFavoritePhotos, fetchMyFavorites])

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-dark px-5 text-center">
        <Heart className="mb-4 h-12 w-12 text-gold/50" />
        <h1 className="font-serif text-2xl text-gold">Your favorites</h1>
        <p className="mt-3 max-w-sm text-cream/60">
          Sign in to save and view photos you love.
        </p>
        <Link
          to="/login"
          className="mt-8 rounded border border-gold/40 bg-gold/15 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-gold hover:bg-gold/25"
        >
          Sign in
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-dark">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-48 bg-gradient-to-b from-gold/5 to-transparent sm:top-[4.5rem]" />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-10"
        >
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Silva Family</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-gold sm:text-4xl lg:text-5xl">
            Favorites
          </h1>
          <p className="mt-3 text-sm text-cream/60">
            Photos you have marked with a heart
            {isAdmin ? ' — tap the heart on any gallery photo to add more.' : '.'}
          </p>
        </motion.header>

        {error && (
          <p className="mb-6 rounded border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

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
    </main>
  )
}
