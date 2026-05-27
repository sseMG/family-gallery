import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

export function usePhotoComments() {
  const comments = useStore((s) => s.comments)
  const setComments = useStore((s) => s.setComments)
  const addComment = useStore((s) => s.addComment)
  const updateComment = useStore((s) => s.updateComment)
  const removeComment = useStore((s) => s.removeComment)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchComments = useCallback(
    async (photoId) => {
      try {
        requireSupabase()
      } catch (err) {
        setError(err.message)
        return { comments: [], error: err }
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('photo_comments')
        .select(
          `
          *,
          profiles:user_id (display_name, avatar_url)
        `
        )
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true })

      setLoading(false)

      if (fetchError) {
        setError(fetchError.message)
        return { comments: [], error: fetchError }
      }

      // Transform data to flatten profile info
      const transformed = (data || []).map((comment) => ({
        ...comment,
        user_name: comment.profiles?.display_name || 'Family Member',
        user_avatar: comment.profiles?.avatar_url || null,
      }))

      setComments(photoId, transformed)
      return { comments: transformed, error: null }
    },
    [setComments]
  )

  const createComment = useCallback(
    async (photoId, content, parentId = null) => {
      try {
        requireSupabase()
      } catch (err) {
        setError(err.message)
        return { comment: null, error: err }
      }

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        setError('Authentication required')
        return { comment: null, error: new Error('Authentication required') }
      }
      const user = userData.user

      setError(null)

      const { data, error: insertError } = await supabase
        .from('photo_comments')
        .insert({
          photo_id: photoId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId,
        })
        .select('*')
        .single()

      if (insertError) {
        setError(insertError.message)
        return { comment: null, error: insertError }
      }

      // Transform and add to store using user metadata
      const transformed = {
        ...data,
        user_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Family Member',
        user_avatar: user.user_metadata?.avatar_url || null,
      }

      addComment(photoId, transformed)
      return { comment: transformed, error: null }
    },
    [addComment]
  )

  const editComment = useCallback(
    async (photoId, commentId, content) => {
      try {
        requireSupabase()
      } catch (err) {
        setError(err.message)
        return { error: err }
      }

      setError(null)

      const { data, error: updateError } = await supabase
        .from('photo_comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        return { error: updateError }
      }

      updateComment(photoId, commentId, {
        content: data.content,
        updated_at: data.updated_at,
      })
      return { error: null }
    },
    [updateComment]
  )

  const deleteComment = useCallback(
    async (photoId, commentId) => {
      try {
        requireSupabase()
      } catch (err) {
        setError(err.message)
        return { error: err }
      }

      setError(null)

      const { error: deleteError } = await supabase
        .from('photo_comments')
        .delete()
        .eq('id', commentId)

      if (deleteError) {
        setError(deleteError.message)
        return { error: deleteError }
      }

      removeComment(photoId, commentId)
      return { error: null }
    },
    [removeComment]
  )

  // Subscribe to real-time comment updates
  const subscribeToComments = useCallback(
    (photoId, onNewComment) => {
      if (!supabase) return null

      const subscription = supabase
        .channel(`photo_comments:${photoId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'photo_comments',
            filter: `photo_id=eq.${photoId}`,
          },
          async (payload) => {
            // Fetch full comment with profile info
            const { data } = await supabase
              .from('photo_comments')
              .select(
                `
                *,
                profiles:user_id (display_name, avatar_url)
              `
              )
              .eq('id', payload.new.id)
              .single()

            if (data) {
              const transformed = {
                ...data,
                user_name: data.profiles?.display_name || 'Family Member',
                user_avatar: data.profiles?.avatar_url || null,
              }
              addComment(photoId, transformed)
              onNewComment?.(transformed)
            }
          }
        )
        .subscribe()

      return subscription
    },
    [addComment]
  )

  const unsubscribeFromComments = useCallback((subscription) => {
    if (subscription) {
      supabase?.removeChannel(subscription)
    }
  }, [])

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    editComment,
    deleteComment,
    subscribeToComments,
    unsubscribeFromComments,
  }
}
