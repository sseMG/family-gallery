import { useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'

async function upsertProfile(user) {
  if (!supabase || !user) return
  try {
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Family Member',
        avatar_url: user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: 'id' },
    )
  } catch (err) {
    // Silently fail - don't block login
  }
}

// Fetch role with timeout - never block login
async function fetchUserRole(userId) {
  if (!supabase || !userId) return 'member'
  
  // Create a timeout promise
  const timeout = new Promise((resolve) => setTimeout(() => resolve('member'), 3000))
  
  try {
    const query = supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors
    
    // Race between query and timeout
    const result = await Promise.race([query, timeout])
    
    // If timeout won, result is 'member' string
    if (result === 'member') return 'member'
    
    // Otherwise it's the supabase result
    const { data, error } = result
    if (error || !data) return 'member'
    return data.role || 'member'
  } catch (err) {
    return 'member'
  }
}

export function useAuth() {
  const user = useStore((s) => s.user)
  const userRole = useStore((s) => s.userRole)
  const setUser = useStore((s) => s.setUser)
  const setUserRole = useStore((s) => s.setUserRole)

  const getSession = useCallback(async () => {
    if (!supabase) return { user: null, error: new Error('Supabase not configured') }
    const { data, error } = await supabase.auth.getSession()
    if (error) return { user: null, error }
    const sessionUser = data.session?.user ?? null
    setUser(sessionUser)
    if (sessionUser) {
      upsertProfile(sessionUser)
      const role = await fetchUserRole(sessionUser.id)
      setUserRole(role)
    } else {
      setUserRole(null)
    }
    return { user: sessionUser, error: null }
  }, [setUser, setUserRole])

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
      
      // Set user immediately so UI updates
      setUser(data.user)
      
      // Do these in background - don't block
      upsertProfile(data.user)
      fetchUserRole(data.user.id).then(role => {
        setUserRole(role)
      })
      
      return { user: data.user, error: null }
    },
    [setUser, setUserRole],
  )

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null)
      setUserRole(null)
      return { error: null }
    }
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    useStore.getState().setFavoritePhotoIds(new Set())
    return { error }
  }, [setUser, setUserRole])

  const isAdmin = userRole === 'admin'

  return {
    user,
    userRole,
    isAdmin,
    signIn,
    signOut,
    getSession,
  }
}

export function useAuthListener() {
  const setUser = useStore((s) => s.setUser)
  const setUserRole = useStore((s) => s.setUserRole)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        upsertProfile(sessionUser)
        const role = await fetchUserRole(sessionUser.id)
        setUserRole(role)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        upsertProfile(sessionUser)
        const role = await fetchUserRole(sessionUser.id)
        setUserRole(role)
      } else {
        setUserRole(null)
        useStore.getState().setFavoritePhotoIds(new Set())
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setUserRole])
}
