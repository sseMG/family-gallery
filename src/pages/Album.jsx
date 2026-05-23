import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus } from 'lucide-react'
import AlbumCard from '../components/gallery/AlbumCard'
import PhotoGrid from '../components/gallery/PhotoGrid'
import Lightbox from '../components/gallery/Lightbox'
import CreateAlbumModal from '../components/ui/CreateAlbumModal'
import { AlbumGridSkeleton } from '../components/ui/Skeleton'
import { useAlbums } from '../hooks/useAlbums'
import { usePhotos } from '../hooks/usePhotos'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store'

function AlbumsIndex() {
  const { isAdmin } = useAuth()
  const { albums, loading, error, fetchAlbums } = useAlbums()
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

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
              Albums
            </h1>
            <p className="mt-3 max-w-xl text-sm text-cream/60 sm:text-base">
              Curated collections — holidays, trips, milestones, and more.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded border border-gold/40 bg-gold/15 px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/25"
            >
              <Plus className="h-4 w-4" />
              New Album
            </button>
          )}
        </motion.header>

        {error && (
          <p className="mb-6 rounded border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <AlbumGridSkeleton />
        ) : albums.length === 0 ? (
          <p className="py-16 text-center text-cream/50">
            No albums yet.{isAdmin ? ' Create one to get started.' : ''}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {albums.map((album, index) => (
              <AlbumCard key={album.id} album={album} index={index} />
            ))}
          </div>
        )}
      </div>

      <CreateAlbumModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => fetchAlbums()}
      />
    </main>
  )
}

function AlbumDetail({ albumId }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [album, setAlbum] = useState(null)
  const [albumPhotos, setAlbumPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const { fetchAlbumById } = useAlbums()
  const { fetchPhotosByAlbum } = usePhotos()
  const setSelectedAlbum = useStore((s) => s.setSelectedAlbum)

  useEffect(() => {
    setSelectedAlbum(albumId)
    return () => setSelectedAlbum(null)
  }, [albumId, setSelectedAlbum])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [{ album: a }, { photos: p }] = await Promise.all([
        fetchAlbumById(albumId),
        fetchPhotosByAlbum(albumId),
      ])
      if (!cancelled) {
        setAlbum(a)
        setAlbumPhotos(p ?? [])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [albumId, fetchAlbumById, fetchPhotosByAlbum])

  if (loading) {
    return (
      <main className="min-h-screen bg-dark">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="mb-8 h-8 w-32 animate-shimmer rounded bg-gold/10" />
          <div className="mb-4 h-12 w-2/3 animate-shimmer rounded bg-gold/10" />
          <AlbumGridSkeleton count={4} />
        </div>
      </main>
    )
  }

  if (!album) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-dark px-5 text-center">
        <h1 className="font-serif text-2xl text-gold">Album not found</h1>
        <Link
          to="/albums"
          className="mt-6 text-sm text-cream/60 transition-colors hover:text-gold"
        >
          Back to albums
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-dark">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-48 bg-gradient-to-b from-gold/5 to-transparent sm:top-[4.5rem]" />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <Link
          to="/albums"
          className="mb-6 inline-flex items-center gap-2 text-sm text-cream/60 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          All albums
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-10"
        >
          {album.year != null && (
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
              {album.year}
            </p>
          )}
          <h1 className="mt-2 font-serif text-3xl font-bold text-gold sm:text-4xl lg:text-5xl">
            {album.title}
          </h1>
          {album.description && (
            <p className="mt-3 max-w-xl text-sm text-cream/60 sm:text-base">
              {album.description}
            </p>
          )}
        </motion.header>

        <PhotoGrid
          photos={albumPhotos}
          onPhotoClick={(index) => setLightboxIndex(index)}
        />
      </div>

      <Lightbox
        photos={albumPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={() => setLightboxIndex((i) => (i > 0 ? i - 1 : i))}
        onNext={() =>
          setLightboxIndex((i) => (i < albumPhotos.length - 1 ? i + 1 : i))
        }
      />
    </main>
  )
}

export default function Album() {
  const { id } = useParams()
  if (id) return <AlbumDetail albumId={id} />
  return <AlbumsIndex />
}
