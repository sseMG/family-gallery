import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

function normalizeAlbum(row) {
  if (!row) return null
  const count = row.photos?.[0]?.count ?? row.photo_count ?? 0
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    description: row.description,
    cover_url: row.cover_url,
    photo_count: count,
    created_at: row.created_at,
  }
}

export function useAlbums() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAlbums = useCallback(async () => {
    requireSupabase()
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('albums')
      .select('*, photos(count)')
      .order('year', { ascending: false })

    setLoading(false)
    if (fetchError) {
      setError(fetchError.message)
      return { albums: [], error: fetchError }
    }

    const normalized = (data ?? []).map(normalizeAlbum)
    setAlbums(normalized)
    return { albums: normalized, error: null }
  }, [])

  const fetchAlbumById = useCallback(async (id) => {
    requireSupabase()
    const { data, error: fetchError } = await supabase
      .from('albums')
      .select('*, photos(count)')
      .eq('id', id)
      .single()

    if (fetchError) return { album: null, error: fetchError }
    return { album: normalizeAlbum(data), error: null }
  }, [])

  const createAlbum = useCallback(async ({ title, year, description }) => {
    requireSupabase()
    const { data, error: insertError } = await supabase
      .from('albums')
      .insert({
        title,
        year: year ? Number(year) : null,
        description: description || null,
      })
      .select('*, photos(count)')
      .single()

    if (insertError) throw new Error(insertError.message)
    const album = normalizeAlbum(data)
    setAlbums((prev) => [album, ...prev])
    return album
  }, [])

  return {
    albums,
    loading,
    error,
    fetchAlbums,
    fetchAlbumById,
    createAlbum,
  }
}
