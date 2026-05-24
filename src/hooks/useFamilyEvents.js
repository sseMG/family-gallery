import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
}

export const EVENT_TYPES = [
  'Birthday',
  'Anniversary',
  'Reunion',
  'Trip',
  'Holiday',
  'Memory',
  'Other',
]

export function formatEventDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function getEventMonthDay(value) {
  if (!value) return { month: '', day: '' }
  const date = new Date(`${value}T00:00:00`)
  return {
    month: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
    day: new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date),
  }
}

export function useFamilyEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchEvents = useCallback(async ({ upcomingOnly = false, limit } = {}) => {
    requireSupabase()
    setLoading(true)
    setError(null)

    let query = supabase
      .from('family_events')
      .select('*')
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })

    if (upcomingOnly) {
      query = query.gte('event_date', new Date().toISOString().slice(0, 10))
    }

    if (limit) query = query.limit(limit)

    const { data, error: fetchError } = await query
    setLoading(false)

    if (fetchError) {
      setError(fetchError.message)
      return { events: [], error: fetchError }
    }

    setEvents(data ?? [])
    return { events: data ?? [], error: null }
  }, [])

  const createEvent = useCallback(
    async ({ title, description, event_date, event_time, location, type }) => {
      requireSupabase()
      if (!user) throw new Error('You must be signed in to add events.')

      const { data, error: insertError } = await supabase
        .from('family_events')
        .insert({
          title,
          description: description || null,
          event_date,
          event_time: event_time || null,
          location: location || null,
          type: type || 'Other',
          created_by: user.id,
        })
        .select('*')
        .single()

      if (insertError) throw new Error(insertError.message)
      setEvents((prev) => [...prev, data].sort((a, b) => a.event_date.localeCompare(b.event_date)))
      return data
    },
    [user],
  )

  const deleteEvent = useCallback(async (id) => {
    requireSupabase()
    const { error: deleteError } = await supabase.from('family_events').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setEvents((prev) => prev.filter((event) => event.id !== id))
  }, [])

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    deleteEvent,
  }
}
