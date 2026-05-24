import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

function normalizeAlbum(row, coverMap = {}) {
  if (!row) return null
  const count = row.photos?.[0]?.count ?? row.photo_count ?? 0
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    description: row.description,
    cover_url: row.cover_url || coverMap[row.id] || null,
    photo_count: count,
    created_at: row.created_at,
  }
}

async function fetchCoverMap() {
  const { data } = await supabase
    .from('photos')
    .select('album_id, url, created_at')
    .not('album_id', 'is', null)
    .order('created_at', { ascending: false })

  const map = {}
  for (const row of data ?? []) {
    if (row.album_id && !map[row.album_id]) {
      map[row.album_id] = row.url
    }
  }
  return map
}

export function useAlbums() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAlbums = useCallback(async () => {
    requireSupabase()
    setLoading(true)
    setError(null)

    const [albumsRes, coverMap, photoCounts] = await Promise.all([
      supabase
        .from('albums')
        .select('*')
        .order('year', { ascending: false }),
      fetchCoverMap(),
      supabase
        .from('photos')
        .select('album_id')
        .not('album_id', 'is', null),
    ])

    setLoading(false)
    if (albumsRes.error) {
      setError(albumsRes.error.message)
      return { albums: [], error: albumsRes.error }
    }

    // Count photos per album manually
    const countMap = {}
    for (const row of photoCounts.data ?? []) {
      countMap[row.album_id] = (countMap[row.album_id] || 0) + 1
    }

    const normalized = (albumsRes.data ?? []).map((row) =>
      normalizeAlbum({ ...row, photo_count: countMap[row.id] || 0 }, coverMap),
    )
    setAlbums(normalized)
    return { albums: normalized, error: null }
  }, [])

  const fetchAlbumById = useCallback(async (id) => {
    requireSupabase()
    const [albumRes, coverMap, photoCounts] = await Promise.all([
      supabase.from('albums').select('*').eq('id', id).single(),
      fetchCoverMap(),
      supabase.from('photos').select('album_id').eq('album_id', id),
    ])

    if (albumRes.error) return { album: null, error: albumRes.error }
    const row = { ...albumRes.data, photo_count: photoCounts.data?.length || 0 }
    return { album: normalizeAlbum(row, coverMap), error: null }
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
      .select('*')
      .single()

    if (insertError) throw new Error(insertError.message)
    const album = normalizeAlbum({ ...data, photo_count: 0 })
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
