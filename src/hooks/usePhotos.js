import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary'
import { normalizePhoto, deriveAspect } from '../lib/photos'
import { generateImageHash, checkDuplicateHash } from '../lib/hash'
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
      const userId = useStore.getState().user?.id
      const favoriteIds = await loadFavoriteIds(userId)
      setFavoritePhotoIds(favoriteIds)
      const normalized = mapPhotos(rows, favoriteIds)
      // Sort by created_at descending (newest first)
      const sorted = normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      useStore.getState().setPhotos(sorted)
      return sorted
    },
    [setFavoritePhotoIds],
  )

  const fetchPhotos = useCallback(async () => {
    requireSupabase()
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('photos')
      .select('*, profiles!uploaded_by(full_name)')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setLoading(false)
      setError(fetchError.message)
      return { photos: [], error: fetchError }
    }

    // Fetch favorite counts separately (works for both anon and auth)
    let favCounts = {}
    const { data: favData } = await supabase
      .from('favorites')
      .select('photo_id')
    if (favData) {
      for (const fav of favData) {
        favCounts[fav.photo_id] = (favCounts[fav.photo_id] || 0) + 1
      }
    }

    // Fetch comment counts
    let commentCounts = {}
    const { data: commentData } = await supabase
      .from('photo_comments')
      .select('photo_id')
    if (commentData) {
      for (const comment of commentData) {
        commentCounts[comment.photo_id] = (commentCounts[comment.photo_id] || 0) + 1
      }
    }

    const rows = (data ?? []).map(row => ({
      ...row,
      favorite_count: favCounts[row.id] || 0,
      comment_count: commentCounts[row.id] || 0,
    }))

    setLoading(false)
    const normalized = await enrichAndStore(rows)
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
        .select('*, profiles!uploaded_by(full_name)')
        .eq('year', year)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setLoading(false)
        setError(fetchError.message)
        return { photos: [], error: fetchError }
      }

      let favCounts = {}
      const { data: favData } = await supabase
        .from('favorites')
        .select('photo_id')
      if (favData) {
        for (const fav of favData) {
          favCounts[fav.photo_id] = (favCounts[fav.photo_id] || 0) + 1
        }
      }

      // Fetch comment counts
      let commentCounts = {}
      const { data: commentData } = await supabase
        .from('photo_comments')
        .select('photo_id')
      if (commentData) {
        for (const comment of commentData) {
          commentCounts[comment.photo_id] = (commentCounts[comment.photo_id] || 0) + 1
        }
      }

      const rows = (data ?? []).map(row => ({
        ...row,
        favorite_count: favCounts[row.id] || 0,
        comment_count: commentCounts[row.id] || 0,
      }))

      setLoading(false)
      const normalized = await enrichAndStore(rows)
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
        .select('*, favorites(count), profiles!uploaded_by(full_name)')
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

      // Generate hash for duplicate detection
      const hash = await generateImageHash(file)
      
      // Check for duplicates
      const isDuplicate = await checkDuplicateHash(hash, supabase)
      if (isDuplicate) {
        throw new Error('This photo appears to be a duplicate of one already in the gallery.')
      }

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
        hash,
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
      // Insert in sorted position by created_at (newest first)
      const currentPhotos = useStore.getState().photos
      const newPhotos = [normalized, ...currentPhotos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      useStore.getState().setPhotos(newPhotos)
      return normalized
    },
    [user, updateAlbumCoverIfNeeded],
  )

  const updatePhoto = useCallback(
    async (id, updates) => {
      requireSupabase()
      if (!user) throw new Error('You must be signed in to update photos.')

      // Update and return the row in one call (no aggregate)
      const { data, error: updateError } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', id)
        .select('*')

      if (updateError) throw new Error(updateError.message)

      // If no rows were updated, the RLS policy blocked it
      if (!data || data.length === 0) {
        throw new Error('Update failed — you may not have permission to edit this photo.')
      }

      const updatedRow = data[0]

      // Update photo in store directly with what we know
      const favoriteIds = await loadFavoriteIds(user.id)
      // Manually add favorites count from existing store photo
      const existingPhoto = useStore.getState().photos.find((p) => p.id === id)
      const rowWithFavorites = {
        ...updatedRow,
        favorites: [{ count: existingPhoto?.favorite_count ?? 0 }],
      }
      const normalized = normalizePhoto(rowWithFavorites, { favoriteIds })
      // Update and maintain sorted order by created_at
      const updatedPhotos = useStore.getState().photos.map((p) => (p.id === id ? normalized : p))
      const sortedPhotos = updatedPhotos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      useStore.getState().setPhotos(sortedPhotos)

      return normalized
    },
    [user],
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
    updatePhoto,
    deletePhoto,
  }
}
