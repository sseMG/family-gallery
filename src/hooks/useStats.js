import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useStats() {
  const [stats, setStats] = useState({
    photos: 0,
    albums: 0,
    members: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.')
      return { stats, error: new Error('Supabase is not configured.') }
    }

    setLoading(true)
    setError(null)

    try {
      const [photosRes, albumsRes, profilesRes, uploadersRes] = await Promise.all([
        supabase.from('photos').select('id', { count: 'exact', head: true }),
        supabase.from('albums').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('photos').select('uploaded_by'),
      ])

      if (photosRes.error) throw photosRes.error
      if (albumsRes.error) throw albumsRes.error

      let members = profilesRes.count ?? 0
      if (!profilesRes.error && members === 0 && uploadersRes.data) {
        const unique = new Set(
          uploadersRes.data.map((r) => r.uploaded_by).filter(Boolean),
        )
        members = unique.size
      }
      if (profilesRes.error) {
        const unique = new Set(
          (uploadersRes.data ?? []).map((r) => r.uploaded_by).filter(Boolean),
        )
        members = unique.size
      }

      const next = {
        photos: photosRes.count ?? 0,
        albums: albumsRes.count ?? 0,
        members: Math.max(members, 1),
      }
      setStats(next)
      return { stats: next, error: null }
    } catch (err) {
      const message = err.message || 'Failed to load stats.'
      setError(message)
      return { stats, error: err }
    } finally {
      setLoading(false)
    }
  }, [])

  return { stats, loading, error, fetchStats }
}
