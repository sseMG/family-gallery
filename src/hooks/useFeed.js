import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'

const POSTS_PER_PAGE = 10

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

// Simple relative time formatter
function timeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2628000) return `${Math.floor(seconds / 604800)}w ago`
  return `${Math.floor(seconds / 2628000)}mo ago`
}

export function useFeed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const subscriptionRef = useRef(null)

  const fetchPosts = useCallback(
    async (reset = false) => {
      requireSupabase()
      setLoading(true)
      setError(null)

      const currentOffset = reset ? 0 : offset

      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*, profiles!uploaded_by(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + POSTS_PER_PAGE - 1)

      setLoading(false)

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      // Transform data with relative time
      const transformed = (data || []).map((post) => ({
        ...post,
        timeAgo: timeAgo(post.created_at),
        uploader: post.profiles || {
          full_name: 'Family Member',
          avatar_url: null,
        },
      }))

      if (reset) {
        setPosts(transformed)
        setOffset(POSTS_PER_PAGE)
      } else {
        setPosts((prev) => [...prev, ...transformed])
        setOffset((prev) => prev + POSTS_PER_PAGE)
      }

      setHasMore(data?.length === POSTS_PER_PAGE)
    },
    [offset]
  )

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(false)
    }
  }, [fetchPosts, loading, hasMore])

  const refresh = useCallback(() => {
    fetchPosts(true)
  }, [fetchPosts])

  // Real-time subscription for new posts
  useEffect(() => {
    if (!supabase) return

    subscriptionRef.current = supabase
      .channel('feed-photos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
        },
        async (payload) => {
          // Fetch the new post with profile info
          const { data } = await supabase
            .from('photos')
            .select('*, profiles!uploaded_by(full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            const newPost = {
              ...data,
              timeAgo: 'Just now',
              uploader: data.profiles || {
                full_name: 'Family Member',
                avatar_url: null,
              },
            }
            setPosts((prev) => [newPost, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [])

  return {
    posts,
    loading,
    error,
    hasMore,
    fetchPosts,
    loadMore,
    refresh,
  }
}
