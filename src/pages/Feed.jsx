import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFeed } from '../hooks/useFeed'
import { useStore } from '../store'
import FeedPost from '../components/feed/FeedPost'
import Lightbox from '../components/gallery/Lightbox'
import { PhotoGridSkeleton } from '../components/ui/Skeleton'

export default function Feed() {
  const { user, isAdmin } = useAuth()
  const { posts, loading, error, hasMore, fetchPosts, loadMore } = useFeed()
  const setUploadModalOpen = useStore((s) => s.setUploadModalOpen)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [showCommentsOnOpen, setShowCommentsOnOpen] = useState(false)

  // Initial load
  useEffect(() => {
    fetchPosts(true)
  }, [fetchPosts])

  // Handle photo click for lightbox
  const handlePhotoClick = useCallback(
    (post) => {
      const index = posts.findIndex((p) => p.id === post.id)
      if (index !== -1) {
        setShowCommentsOnOpen(false)
        setLightboxIndex(index)
      }
    },
    [posts]
  )

  // Handle comment click for lightbox with comments
  const handleCommentClick = useCallback(
    (post) => {
      const index = posts.findIndex((p) => p.id === post.id)
      if (index !== -1) {
        setShowCommentsOnOpen(true)
        setLightboxIndex(index)
      }
    },
    [posts]
  )

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      {/* Header with gradient */}
      <div className="sticky top-0 z-40 border-b border-gold/10 bg-gradient-to-b from-[#0d0d0d] via-[#0d0d0d] to-[#0d0d0d]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[600px] items-center justify-between px-4 py-4">
          <div>
            <h1 className="font-serif text-xl text-gold">Family Feed</h1>
            <p className="text-xs text-cream/40">Share moments with your family</p>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-1.5 rounded border border-gold/35 bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold/20"
            >
              <Upload className="h-3.5 w-3.5" />
              Memory Drop
            </button>
          )}
        </div>
      </div>

      {/* Feed content */}
      <div className="mx-auto max-w-[600px] px-4 py-6">
        {error && (
          <div className="mb-6 rounded border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && posts.length === 0 ? (
          <PhotoGridSkeleton />
        ) : posts.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full border border-gold/20 bg-gold/5 p-6">
              <Upload className="h-8 w-8 text-gold/60" />
            </div>
            <h2 className="mb-2 font-serif text-lg text-cream">
              No memories yet
            </h2>
            <p className="mb-6 max-w-xs text-sm text-cream/50">
              Be the first to share a photo with your family!
            </p>
            {user ? (
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="rounded border border-gold/40 bg-gold/15 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold/25"
              >
                Upload First Photo
              </button>
            ) : (
              <p className="text-sm text-cream/40">
                Sign in to start sharing memories
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <FeedPost
                  post={post}
                  onPhotoClick={handlePhotoClick}
                  onCommentClick={handleCommentClick}
                />
              </motion.div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  className="flex items-center gap-2 rounded border border-gold/30 bg-dark/50 px-6 py-3 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <p className="py-4 text-center text-xs text-cream/30">
                You&apos;ve reached the end
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        photos={posts}
        activeIndex={lightboxIndex}
        initialShowComments={showCommentsOnOpen}
        onClose={() => {
          setLightboxIndex(null)
          setShowCommentsOnOpen(false)
        }}
        onPrev={() =>
          setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))
        }
        onNext={() =>
          setLightboxIndex((i) =>
            i !== null && i < posts.length - 1 ? i + 1 : i
          )
        }
      />
    </main>
  )
}
