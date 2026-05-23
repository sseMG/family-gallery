import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { normalizePhoto } from '../lib/photos'
import { useStore } from '../store'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

export function useFavorites() {
  const user = useStore((s) => s.user)
  const favoritePhotoIds = useStore((s) => s.favoritePhotoIds)
  const setFavoritePhotoIds = useStore((s) => s.setFavoritePhotoIds)
  const toggleFavoriteId = useStore((s) => s.toggleFavoriteId)
  const setPhotos = useStore((s) => s.setPhotos)
  const photos = useStore((s) => s.photos)

  const fetchMyFavorites = useCallback(async () => {
    requireSupabase()
    if (!user) {
      setFavoritePhotoIds(new Set())
      return new Set()
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('photo_id')
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    const ids = new Set((data ?? []).map((r) => r.photo_id))
    setFavoritePhotoIds(ids)
    return ids
  }, [user, setFavoritePhotoIds])

  const fetchFavoritePhotos = useCallback(async () => {
    requireSupabase()
    if (!user) return []

    const { data, error } = await supabase
      .from('favorites')
      .select('photo_id, photos(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const rows = (data ?? []).map((row) => row.photos).filter(Boolean)
    const favoriteIds = new Set(rows.map((p) => p.id))
    return rows.map((row) =>
      normalizePhoto({ ...row, favorites: [{ count: row.favorites?.[0]?.count }] }, { favoriteIds }),
    )
  }, [user])

  const toggleFavorite = useCallback(
    async (photoId) => {
      requireSupabase()
      if (!user) throw new Error('Sign in to favorite photos.')

      const isFavorited = favoritePhotoIds.has(photoId)

      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('photo_id', photoId)
        if (error) throw new Error(error.message)
        toggleFavoriteId(photoId, false)
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, photo_id: photoId })
        if (error) throw new Error(error.message)
        toggleFavoriteId(photoId, true)
      }

      setPhotos(
        photos.map((p) =>
          p.id === photoId
            ? {
                ...p,
                favorite_count: Math.max(
                  0,
                  (p.favorite_count ?? 0) + (isFavorited ? -1 : 1),
                ),
                is_favorited: !isFavorited,
              }
            : p,
        ),
      )
    },
    [user, favoritePhotoIds, toggleFavoriteId, photos, setPhotos],
  )

  return {
    favoritePhotoIds,
    fetchMyFavorites,
    fetchFavoritePhotos,
    toggleFavorite,
    isFavorited: (photoId) => favoritePhotoIds.has(photoId),
  }
}
