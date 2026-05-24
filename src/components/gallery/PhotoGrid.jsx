import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Trash2, MapPin, Calendar, Pencil } from 'lucide-react'
import { getPhotoDisplayUrl } from '../../lib/photos'
import { useAuth } from '../../hooks/useAuth'
import { useFavorites } from '../../hooks/useFavorites'
import { usePhotos } from '../../hooks/usePhotos'
import PhotoEditModal from '../ui/PhotoEditModal'

const aspectClass = {
  tall: 'aspect-[3/4]',
  wide: 'aspect-[4/3]',
  square: 'aspect-square',
}

function PhotoCard({ photo, index, onPhotoClick, showActions = true }) {
  const { user, isAdmin } = useAuth()
  const { toggleFavorite, isFavorited } = useFavorites()
  const { deletePhoto } = usePhotos()
  const [deleting, setDeleting] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const handleEdit = (e) => {
    e.stopPropagation()
    setEditOpen(true)
  }

  const favorited = photo.is_favorited ?? isFavorited(photo.id)

  const handleFavorite = async (e) => {
    e.stopPropagation()
    if (!user) return
    setFavLoading(true)
    try {
      await toggleFavorite(photo.id)
    } catch (err) {
      alert(err.message)
    } finally {
      setFavLoading(false)
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this photo permanently?')) return
    setDeleting(true)
    try {
      await deletePhoto(photo.id)
    } catch (err) {
      alert(err.message)
      setDeleting(false)
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
      className={`group relative mb-4 w-full break-inside-avoid overflow-hidden rounded-lg border border-gold/10 bg-dark/50 transition-all duration-300 hover:scale-[1.02] hover:border-gold/60 hover:shadow-[0_0_24px_rgba(201,169,110,0.25)] sm:mb-5 ${aspectClass[photo.aspect] || aspectClass.square}`}
    >
      <button
        type="button"
        onClick={() => onPhotoClick(index)}
        className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <img
          src={getPhotoDisplayUrl(photo, 600)}
          alt={photo.caption || 'Family photo'}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </button>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="line-clamp-2 text-left font-serif text-sm text-cream">
          {photo.caption || 'Untitled'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-cream/60">
          {photo.year != null && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gold/70" />
              {photo.year}
            </span>
          )}
          {photo.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gold/70" />
              {photo.location}
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleFavorite}
            disabled={favLoading || !user}
            title={user ? 'Favorite' : 'Sign in to favorite'}
            className={`rounded-full border bg-dark/90 p-2 transition-all ${
              favorited
                ? 'border-gold text-gold'
                : 'border-gold/30 text-cream/80 hover:border-gold hover:text-gold'
            } ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
          </button>
          {(photo.favorite_count ?? 0) > 0 && (
            <span className="flex items-center rounded-full border border-gold/20 bg-dark/90 px-2 text-xs text-gold">
              {photo.favorite_count}
            </span>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleEdit}
                title="Edit photo details"
                className="rounded-full border border-gold/30 bg-dark/90 p-2 text-cream/80 transition-colors hover:border-gold hover:text-gold"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                title="Delete photo"
                className="rounded-full border border-red-400/30 bg-dark/90 p-2 text-red-400/90 transition-colors hover:border-red-400 hover:bg-red-400/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}

      <PhotoEditModal
        photos={[photo]}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => setEditOpen(false)}
      />
    </motion.article>
  )
}

export default function PhotoGrid({ photos, onPhotoClick, showActions = true }) {
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
        <PhotoCard
          key={photo.id}
          photo={photo}
          index={index}
          onPhotoClick={onPhotoClick}
          showActions={showActions}
        />
      ))}
    </div>
  )
}
