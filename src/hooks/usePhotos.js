import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary'
import { normalizePhoto, deriveAspect } from '../lib/photos'
import { useStore } from '../store'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

async function loadFavoriteIds(userId) {
  if (!userId) return new Set()
  const { data } = await supabase
    .from('favorites')
    .select('photo_id')
    .eq('user_id', userId)
  return new Set((data ?? []).map((r) => r.photo_id))
}

function mapPhotos(rows, favoriteIds) {
  return (rows ?? []).map((row) => normalizePhoto(row, { favoriteIds }))
}

export function usePhotos() {
  const photos = useStore((s) => s.photos)
  const user = useStore((s) => s.user)
  const setFavoritePhotoIds = useStore((s) => s.setFavoritePhotoIds)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const enrichAndStore = useCallback(
    async (rows) => {
      const favoriteIds = await loadFavoriteIds(user?.id)
      setFavoritePhotoIds(favoriteIds)
      const normalized = mapPhotos(rows, favoriteIds)
      useStore.getState().setPhotos(normalized)
      return normalized
    },
    [user?.id, setFavoritePhotoIds],
  )

  const fetchPhotos = useCallback(async () => {
    requireSupabase()
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('photos')
      .select('*, favorites(count)')
      .order('created_at', { ascending: false })

    setLoading(false)
    if (fetchError) {
      setError(fetchError.message)
      return { photos: [], error: fetchError }
    }
    const normalized = await enrichAndStore(data)
    return { photos: normalized, error: null }
  }, [enrichAndStore])

  const fetchPhotosByYear = useCallback(
    async (year) => {
      if (year === 'All') return fetchPhotos()
      requireSupabase()
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*, favorites(count)')
        .eq('year', year)
        .order('created_at', { ascending: false })

      setLoading(false)
      if (fetchError) {
        setError(fetchError.message)
        return { photos: [], error: fetchError }
      }
      const normalized = await enrichAndStore(data)
      return { photos: normalized, error: null }
    },
    [fetchPhotos, enrichAndStore],
  )

  const fetchPhotosByAlbum = useCallback(
    async (albumId) => {
      requireSupabase()
      const favoriteIds = await loadFavoriteIds(user?.id)
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*, favorites(count)')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        return { photos: [], error: fetchError }
      }
      return { photos: mapPhotos(data, favoriteIds), error: null }
    },
    [user?.id],
  )

  const updateAlbumCoverIfNeeded = useCallback(async (albumId, url) => {
    if (!albumId || !url) return
    const { data: album } = await supabase
      .from('albums')
      .select('cover_url')
      .eq('id', albumId)
      .single()
    if (album && !album.cover_url) {
      await supabase.from('albums').update({ cover_url: url }).eq('id', albumId)
    }
  }, [])

  const uploadPhoto = useCallback(
    async (file, metadata, onProgress) => {
      requireSupabase()
      if (!user) throw new Error('You must be signed in to upload photos.')

      const cloudinary = await uploadToCloudinary(file, onProgress)

      const row = {
        url: cloudinary.url,
        public_id: cloudinary.public_id,
        caption: metadata.caption || null,
        year: metadata.year ? Number(metadata.year) : null,
        location: metadata.location || null,
        album_id: metadata.album_id || null,
        uploaded_by: user.id,
        width: cloudinary.width,
        height: cloudinary.height,
        aspect: deriveAspect(cloudinary.width, cloudinary.height),
      }

      const { data, error: insertError } = await supabase
        .from('photos')
        .insert(row)
        .select('*, favorites(count)')
        .single()

      if (insertError) {
        try {
          await deleteFromCloudinary(cloudinary.public_id)
        } catch {
          /* rollback best-effort */
        }
        throw new Error(insertError.message)
      }

      if (metadata.album_id) {
        await updateAlbumCoverIfNeeded(metadata.album_id, cloudinary.url)
      }

      const favoriteIds = await loadFavoriteIds(user.id)
      const normalized = normalizePhoto(data, { favoriteIds })
      useStore.getState().setPhotos([normalized, ...useStore.getState().photos])
      return normalized
    },
    [user, updateAlbumCoverIfNeeded],
  )

  const deletePhoto = useCallback(
    async (id) => {
      requireSupabase()
      if (!user) throw new Error('You must be signed in to delete photos.')

      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('public_id')
        .eq('id', id)
        .single()

      if (fetchError) throw new Error(fetchError.message)

      if (photo?.public_id) {
        try {
          await deleteFromCloudinary(photo.public_id)
        } catch {
          /* continue Supabase delete if edge function not deployed */
        }
      }

      const { error: deleteError } = await supabase.from('photos').delete().eq('id', id)
      if (deleteError) throw new Error(deleteError.message)

      useStore.getState().setPhotos(useStore.getState().photos.filter((p) => p.id !== id))
    },
    [user],
  )

  return {
    photos,
    loading,
    error,
    fetchPhotos,
    fetchPhotosByYear,
    fetchPhotosByAlbum,
    uploadPhoto,
    deletePhoto,
  }
}
