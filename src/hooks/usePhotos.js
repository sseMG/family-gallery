import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary'
import { normalizePhoto, deriveAspect } from '../lib/photos'
import { useStore } from '../store'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

export function usePhotos() {
  const photos = useStore((s) => s.photos)
  const setPhotos = useStore((s) => s.setPhotos)
  const user = useStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPhotos = useCallback(async () => {
    requireSupabase()
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })

    setLoading(false)
    if (fetchError) {
      setError(fetchError.message)
      return { photos: [], error: fetchError }
    }
    const normalized = (data ?? []).map(normalizePhoto)
    setPhotos(normalized)
    return { photos: normalized, error: null }
  }, [setPhotos])

  const fetchPhotosByYear = useCallback(
    async (year) => {
      if (year === 'All') return fetchPhotos()
      requireSupabase()
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: false })

      setLoading(false)
      if (fetchError) {
        setError(fetchError.message)
        return { photos: [], error: fetchError }
      }
      const normalized = (data ?? []).map(normalizePhoto)
      setPhotos(normalized)
      return { photos: normalized, error: null }
    },
    [fetchPhotos, setPhotos],
  )

  const fetchPhotosByAlbum = useCallback(async (albumId) => {
    requireSupabase()
    const { data, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return { photos: [], error: fetchError }
    }
    const normalized = (data ?? []).map(normalizePhoto)
    return { photos: normalized, error: null }
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
        .select()
        .single()

      if (insertError) {
        try {
          await deleteFromCloudinary(cloudinary.public_id)
        } catch {
          /* rollback best-effort */
        }
        throw new Error(insertError.message)
      }

      const normalized = normalizePhoto(data)
      setPhotos([normalized, ...useStore.getState().photos])
      return normalized
    },
    [user, setPhotos],
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
        await deleteFromCloudinary(photo.public_id)
      }

      const { error: deleteError } = await supabase.from('photos').delete().eq('id', id)
      if (deleteError) throw new Error(deleteError.message)

      setPhotos(useStore.getState().photos.filter((p) => p.id !== id))
    },
    [user, setPhotos],
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
