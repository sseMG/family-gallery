import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Heart, Trash2, MapPin, Calendar, Pencil, Check } from 'lucide-react'
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

function PhotoCard({ photo, index, onPhotoClick, showActions = true, selectMode = false, isSelected = false, onSelectPhoto, onEnterSelectMode }) {
  const { user, isAdmin } = useAuth()
  const { toggleFavorite, isFavorited } = useFavorites()
  const { deletePhoto } = usePhotos()
  const [deleting, setDeleting] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Long press detection
  const pressTimer = useRef(null)
  const isLongPress = useRef(false)

  const startPress = useCallback(() => {
    isLongPress.current = false
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onEnterSelectMode?.(photo.id)
    }, 500)
  }, [photo.id, onEnterSelectMode])

  const endPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }, [])

  const handleClick = useCallback(() => {
    if (isLongPress.current) return
    if (selectMode) {
      onSelectPhoto?.(photo.id)
    } else {
      onPhotoClick?.(index)
    }
  }, [selectMode, onSelectPhoto, photo.id, onPhotoClick, index])

  const handleCheckboxClick = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    if (!selectMode) {
      // Enter select mode and select this photo
      onEnterSelectMode?.(photo.id)
    } else {
      // Toggle selection
      onSelectPhoto?.(photo.id)
    }
  }, [selectMode, onEnterSelectMode, onSelectPhoto, photo.id])

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
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => {
        setIsHovered(false)
        endPress()
      }}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      className={`group relative w-full overflow-hidden rounded-lg border transition-all duration-300 ${
        aspectClass[photo.aspect] || aspectClass.square
      } ${
        isSelected
          ? 'border-gold ring-2 ring-gold shadow-[0_0_24px_rgba(201,169,110,0.4)]'
          : 'border-gold/10 bg-dark/50 hover:scale-[1.02] hover:border-gold/60 hover:shadow-[0_0_24px_rgba(201,169,110,0.25)]'
      }`}
    >
      {/* Selection Checkbox - 44x44px touch target */}
      {(selectMode || isHovered) && (
        <button
          type="button"
          className="absolute left-0 top-0 z-30 flex h-11 w-11 cursor-pointer items-center justify-center p-2.5"
          onClick={handleCheckboxClick}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
              isSelected
                ? 'border-gold bg-gold text-dark'
                : 'border-gold/50 bg-dark/80 text-cream/50 hover:border-gold'
            }`}
          >
            {isSelected && <Check className="h-4 w-4" />}
          </div>
        </button>
      )}

      <button
        type="button"
        onClick={handleClick}
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

export default function PhotoGrid({ photos, onPhotoClick, showActions = true, selectMode = false, selectedIds = new Set(), onSelectPhoto, onEnterSelectMode }) {
  if (!photos.length) {
    return (
      <p className="py-16 text-center text-cream/50">
        No photos found for this selection.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          index={index}
          onPhotoClick={onPhotoClick}
          showActions={showActions}
          selectMode={selectMode}
          isSelected={selectedIds.has(photo.id)}
          onSelectPhoto={onSelectPhoto}
          onEnterSelectMode={onEnterSelectMode}
        />
      ))}
    </div>
  )
}
