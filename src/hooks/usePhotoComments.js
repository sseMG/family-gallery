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
        .select('*')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true })

      setLoading(false)

      if (fetchError) {
        console.error('[usePhotoComments] fetchComments error:', fetchError)
        setError(fetchError.message)
        return { comments: [], error: fetchError }
      }

      // Fetch user profiles separately for display names
      const userIds = [...new Set((data || []).map(c => c.user_id))]
      let profilesMap = {}
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds)
        if (profilesData) {
          profilesMap = Object.fromEntries(profilesData.map(p => [p.id, p]))
        }
      }

      // Transform data with profile info
      const transformed = (data || []).map((comment) => {
        const profile = profilesMap[comment.user_id]
        return {
          ...comment,
          user_name: profile?.display_name || 'Family Member',
          user_avatar: profile?.avatar_url || null,
        }
      })

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
            // Fetch the new comment
            const { data: commentData } = await supabase
              .from('photo_comments')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (commentData) {
              // Fetch user profile separately
              const { data: profileData } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', commentData.user_id)
                .single()

              const transformed = {
                ...commentData,
                user_name: profileData?.display_name || 'Family Member',
                user_avatar: profileData?.avatar_url || null,
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
