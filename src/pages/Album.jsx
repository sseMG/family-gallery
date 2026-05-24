import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Pencil, Trash2, Image as ImageIcon, X, Check } from 'lucide-react'
import AlbumCard from '../components/gallery/AlbumCard'
import PhotoGrid from '../components/gallery/PhotoGrid'
import Lightbox from '../components/gallery/Lightbox'
import AlbumFormModal from '../components/ui/CreateAlbumModal'
import { AlbumGridSkeleton } from '../components/ui/Skeleton'
import { useAlbums } from '../hooks/useAlbums'
import { usePhotos } from '../hooks/usePhotos'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store'

function AlbumsIndex() {
  const { isAdmin } = useAuth()
  const { albums, loading, error, fetchAlbums, updateAlbum, deleteAlbum, createAlbum } = useAlbums()
  const [formOpen, setFormOpen] = useState(false)
  const [editAlbum, setEditAlbum] = useState(null)

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  async function handleFormSubmit(data) {
    if (editAlbum) {
      await updateAlbum(editAlbum.id, data)
    } else {
      await createAlbum(data)
    }
    fetchAlbums()
  }

  async function handleDelete(album) {
    if (!window.confirm(`Delete "${album.title}"? Photos will be unlinked but not deleted.`)) return
    try {
      await deleteAlbum(album.id)
    } catch (err) {
      alert(err.message)
    }
  }

  function openCreate() {
    setEditAlbum(null)
    setFormOpen(true)
  }

  function openEdit(album) {
    setEditAlbum(album)
    setFormOpen(true)
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
              Albums
            </h1>
            <p className="mt-3 max-w-xl text-sm text-cream/60 sm:text-base">
              Curated collections — holidays, trips, milestones, and more.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreate}
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
              <AlbumCard
                key={album.id}
                album={album}
                index={index}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AlbumFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        album={editAlbum}
      />
    </main>
  )
}

function AlbumDetail({ albumId }) {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { fetchAlbumById, updateAlbum, deleteAlbum, setCoverPhoto } = useAlbums()
  const { fetchPhotosByAlbum } = usePhotos()
  const setSelectedAlbum = useStore((s) => s.setSelectedAlbum)

  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [album, setAlbum] = useState(null)
  const [albumPhotos, setAlbumPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [savingCover, setSavingCover] = useState(false)

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

  async function handleEditSubmit(data) {
    await updateAlbum(albumId, data)
    setEditOpen(false)
    // Refresh album data
    const { album: a } = await fetchAlbumById(albumId)
    setAlbum(a)
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${album.title}"? Photos will be unlinked but not deleted.`)) return
    try {
      await deleteAlbum(albumId)
      navigate('/albums')
    } catch (err) {
      alert(err.message)
    }
  }

  async function handlePickCover(photo) {
    setSavingCover(true)
    try {
      await setCoverPhoto(albumId, photo.url)
      setAlbum((prev) => prev ? { ...prev, cover_url: photo.url } : prev)
      setCoverPickerOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingCover(false)
    }
  }

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
          className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
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
          </div>

          {isAdmin && (
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded border border-gold/40 bg-gold/15 px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:bg-gold/25"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setCoverPickerOpen(true)}
                className="inline-flex items-center gap-2 rounded border border-gold/40 bg-gold/15 px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all hover:bg-gold/25"
              >
                <ImageIcon className="h-4 w-4" />
                Set Cover
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-red-400 transition-all hover:bg-red-400/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
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

      {/* Edit Modal */}
      <AlbumFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        album={album}
      />

      {/* Cover Photo Picker */}
      <AnimatePresence>
        {coverPickerOpen && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setCoverPickerOpen(false)}
            />
            <motion.div
              className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-gold/20 bg-dark shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4">
                <h2 className="font-serif text-xl text-gold">Choose Cover Photo</h2>
                <button onClick={() => setCoverPickerOpen(false)} className="text-cream/60 hover:text-gold">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5">
                {albumPhotos.length === 0 ? (
                  <p className="py-8 text-center text-cream/40">No photos in this album yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {albumPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => handlePickCover(photo)}
                        disabled={savingCover}
                        className={`group relative aspect-square overflow-hidden rounded-lg border transition-all ${
                          album.cover_url === photo.url
                            ? 'border-gold shadow-[0_0_12px_rgba(201,169,110,0.3)]'
                            : 'border-gold/10 hover:border-gold/50'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || ''}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {album.cover_url === photo.url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="rounded-full border border-gold bg-gold/20 p-1.5">
                              <Check className="h-4 w-4 text-gold" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default function Album() {
  const { id } = useParams()
  if (id) return <AlbumDetail albumId={id} />
  return <AlbumsIndex />
}
