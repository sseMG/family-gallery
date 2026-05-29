import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Download, MapPin } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFavorites } from '../../hooks/useFavorites'
import { usePhotoComments } from '../../hooks/usePhotoComments'
import CommentSection from '../gallery/CommentSection'
import { getPhotoDisplayUrl } from '../../lib/photos'

export default function FeedPost({
  post,
  onPhotoClick,
}) {
  const { user } = useAuth()
  const { toggleFavorite, isFavorited } = useFavorites()
  const { comments } = usePhotoComments(post.id)
  const [showComments, setShowComments] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const favorited = isFavorited(post.id)
  const commentCount = comments?.length || post.comment_count || 0
  const favoriteCount = post.favorite_count || 0

  const handleLike = useCallback(
    async (e) => {
      e.stopPropagation()
      if (!user || favLoading) return
      setFavLoading(true)
      try {
        await toggleFavorite(post.id)
      } finally {
        setFavLoading(false)
      }
    },
    [user, favLoading, toggleFavorite, post.id]
  )

  const handleDownload = useCallback(
    async (e) => {
      e.stopPropagation()
      try {
        const response = await fetch(post.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = post.caption
          ? `${post.caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${post.id.slice(0, 8)}.jpg`
          : `photo_${post.id.slice(0, 8)}.jpg`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (err) {
        console.error('Download failed:', err)
      }
    },
    [post.url, post.caption, post.id]
  )

  const toggleComments = useCallback((e) => {
    e.stopPropagation()
    setShowComments((prev) => !prev)
  }, [])

  // Get uploader info
  const uploader = post.uploader || post.profiles || {
    full_name: 'Family Member',
    avatar_url: null,
  }

  // Get initial for avatar fallback
  const initial = uploader.full_name?.charAt(0)?.toUpperCase() || 'F'

  return (
    <article className="w-full overflow-hidden rounded-xl border border-gold/10 bg-dark/80">
      {/* Header - User info */}
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <div className="relative h-10 w-10 flex-shrink-0">
          {uploader.avatar_url ? (
            <img
              src={uploader.avatar_url}
              alt={uploader.full_name}
              className="h-full w-full rounded-full object-cover ring-2 ring-gold/50"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gold/20 ring-2 ring-gold/50">
              <span className="font-serif text-lg font-medium text-gold">
                {initial}
              </span>
            </div>
          )}
        </div>

        {/* Name and meta */}
        <div className="flex flex-col">
          <span className="font-serif text-sm font-medium text-gold">
            {uploader.full_name}
          </span>
          <div className="flex items-center gap-2 text-xs text-cream/40">
            <span>{post.timeAgo}</span>
            {post.location && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {post.location}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-sm text-cream/90">{post.caption}</p>
        </div>
      )}

      {/* Photo */}
      <div
        className="relative w-full cursor-pointer bg-black"
        onClick={() => onPhotoClick?.(post)}
      >
        <img
          src={getPhotoDisplayUrl(post, 800)}
          alt={post.caption || 'Family photo'}
          loading="lazy"
          className="w-full object-contain"
          style={{ maxHeight: '70vh' }}
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 border-t border-gold/10 p-4">
        {/* Like button */}
        <button
          type="button"
          onClick={handleLike}
          disabled={favLoading || !user}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            favorited
              ? 'text-red-400'
              : 'text-cream/60 hover:text-gold'
          } ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Heart
            className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`}
          />
          <span>{favoriteCount > 0 ? favoriteCount : 'Like'}</span>
        </button>

        {/* Comment button */}
        <button
          type="button"
          onClick={toggleComments}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            showComments ? 'text-gold' : 'text-cream/60 hover:text-gold'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span>{commentCount > 0 ? commentCount : 'Comment'}</span>
        </button>

        {/* Download button */}
        <button
          type="button"
          onClick={handleDownload}
          className="ml-auto flex items-center gap-1.5 text-sm text-cream/60 transition-colors hover:text-gold"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gold/10"
          >
            <div className="p-4">
              <CommentSection
                photoId={post.id}
                isOpen={true}
                onClose={() => setShowComments(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
