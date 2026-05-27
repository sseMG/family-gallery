import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, Edit2, X, MessageCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePhotoComments } from '../../hooks/usePhotoComments'

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function CommentItem({ comment, photoId, onEdit, onDelete, currentUserId }) {
  const isOwnComment = comment.user_id === currentUserId
  const isEdited =
    comment.updated_at && comment.updated_at !== comment.created_at
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = comment.content.length > 150
  const displayContent = isLong && !isExpanded
    ? comment.content.slice(0, 150) + '...'
    : comment.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group border-b border-gold/10 py-3 last:border-0"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xs font-medium text-gold">
          {comment.user_name?.[0]?.toUpperCase() || '?'}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium text-cream">
              {comment.user_name}
            </span>
            <span className="text-xs text-cream/40">
              {timeAgo(comment.created_at)}
            </span>
            {isEdited && (
              <span className="text-xs text-cream/30">(edited)</span>
            )}
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed text-cream/80">
            {displayContent}
          </p>
          {isLong && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-xs text-gold/70 hover:text-gold"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}

          {/* Actions */}
          {isOwnComment && (
            <div className="mt-2 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEdit(comment)}
                className="flex items-center gap-1 text-xs text-cream/50 hover:text-gold"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-cream/50 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function CommentSection({ photoId, isOpen, onClose }) {
  const { user } = useAuth()
  const {
    comments,
    loading,
    fetchComments,
    createComment,
    editComment,
    deleteComment,
    subscribeToComments,
    unsubscribeFromComments,
  } = usePhotoComments()

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [editContent, setEditContent] = useState('')
  const subscriptionRef = useRef(null)

  const photoComments = comments[photoId] || []

  // Fetch comments when opened
  useEffect(() => {
    if (isOpen && photoId) {
      fetchComments(photoId)

      // Subscribe to real-time updates
      subscriptionRef.current = subscribeToComments(photoId)

      return () => {
        if (subscriptionRef.current) {
          unsubscribeFromComments(subscriptionRef.current)
        }
      }
    }
  }, [isOpen, photoId, fetchComments, subscribeToComments, unsubscribeFromComments])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!newComment.trim()) return
      if (!user) {
        console.error('[CommentSection] Cannot post: User not authenticated')
        return
      }

      setIsSubmitting(true)
      const { error } = await createComment(photoId, newComment.trim())
      setIsSubmitting(false)

      if (!error) {
        setNewComment('')
      }
    },
    [newComment, photoId, user, createComment]
  )

  const handleEdit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!editContent.trim() || !editingComment) return

      const { error } = await editComment(
        photoId,
        editingComment.id,
        editContent.trim()
      )

      if (!error) {
        setEditingComment(null)
        setEditContent('')
      }
    },
    [editContent, editingComment, photoId, editComment]
  )

  const handleDelete = useCallback(
    async (commentId) => {
      if (!window.confirm('Delete this comment?')) return
      await deleteComment(photoId, commentId)
    },
    [photoId, deleteComment]
  )

  const startEdit = useCallback((comment) => {
    setEditingComment(comment)
    setEditContent(comment.content)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingComment(null)
    setEditContent('')
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 h-full w-80 border-l border-gold/20 bg-dark/95 backdrop-blur-md sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gold/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gold" />
              <h3 className="font-medium text-cream">
                Comments ({photoComments.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-cream/50 hover:bg-gold/10 hover:text-gold"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Comments List */}
          <div className="h-[calc(100%-140px)] overflow-y-auto px-4">
            {loading && photoComments.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
              </div>
            ) : photoComments.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-cream/40">
                  No comments yet. Be the first to share a memory!
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {photoComments.map((comment) =>
                  editingComment?.id === comment.id ? (
                    <motion.div
                      key={`edit-${comment.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gold/10 py-3"
                    >
                      <form onSubmit={handleEdit} className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full resize-none rounded border border-gold/20 bg-dark/50 p-2 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none"
                          rows={3}
                          maxLength={500}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded px-3 py-1 text-xs text-cream/60 hover:text-cream"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!editContent.trim()}
                            className="rounded bg-gold/20 px-3 py-1 text-xs text-gold hover:bg-gold/30 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      photoId={photoId}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      currentUserId={user?.id}
                    />
                  )
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Input Area */}
          {user ? (
            <div className="absolute bottom-0 left-0 right-0 border-t border-gold/10 bg-dark p-4">
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                    placeholder="Write a comment..."
                    className="w-full resize-none rounded border border-gold/20 bg-dark/50 p-3 pr-10 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-cream/30">
                    {newComment.length}/500
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cream/40">
                    Press Enter to post
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="flex items-center gap-1 rounded bg-gold/20 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/30 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Post
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="absolute bottom-0 left-0 right-0 border-t border-gold/10 bg-dark p-4 text-center">
              <p className="text-sm text-cream/50">
                Sign in to leave a comment
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
