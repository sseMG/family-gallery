import { useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'

async function upsertProfile(user) {
  if (!supabase || !user) return
  await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      display_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Family member',
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: 'id' },
  )
}

export function useAuth() {
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)

  const getSession = useCallback(async () => {
    if (!supabase) return { user: null, error: new Error('Supabase not configured') }
    const { data, error } = await supabase.auth.getSession()
    if (error) return { user: null, error }
    const sessionUser = data.session?.user ?? null
    setUser(sessionUser)
    if (sessionUser) await upsertProfile(sessionUser)
    return { user: sessionUser, error: null }
  }, [setUser])

  const signIn = useCallback(
    async (email, password) => {
      if (!supabase) {
        return { user: null, error: new Error('Supabase not configured') }
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) return { user: null, error }
      setUser(data.user)
      await upsertProfile(data.user)
      return { user: data.user, error: null }
    },
    [setUser],
  )

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null)
      return { error: null }
    }
    const { error } = await supabase.auth.signOut()
    setUser(null)
    useStore.getState().setFavoritePhotoIds(new Set())
    return { error }
  }, [setUser])

  return {
    user,
    isAdmin: Boolean(user),
    signIn,
    signOut,
    getSession,
  }
}

export function useAuthListener() {
  const setUser = useStore((s) => s.setUser)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) upsertProfile(sessionUser)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) upsertProfile(sessionUser)
      if (!sessionUser) useStore.getState().setFavoritePhotoIds(new Set())
    })

    return () => subscription.unsubscribe()
  }, [setUser])
}
