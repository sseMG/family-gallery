import { useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'

export function useAuth() {
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)

  const getSession = useCallback(async () => {
    if (!supabase) return { user: null, error: new Error('Supabase not configured') }
    const { data, error } = await supabase.auth.getSession()
    if (error) return { user: null, error }
    const sessionUser = data.session?.user ?? null
    setUser(sessionUser)
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

/** Mount once in App to sync auth state with Zustand. */
export function useAuthListener() {
  const setUser = useStore((s) => s.setUser)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])
}
