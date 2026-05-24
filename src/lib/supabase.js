import { createClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(url) {
  if (typeof url !== 'string') return url
  return url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isValidSupabaseUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false
  if (url.includes('supabase.com/dashboard')) return false
  try {
    const { hostname } = new URL(url)
    return hostname.length > 0
  } catch {
    return false
  }
}

function warnEnvMisconfiguration() {
  if (!import.meta.env.DEV) return
  const raw = import.meta.env.VITE_SUPABASE_URL
  if (raw?.includes('supabase.com/dashboard')) {
    console.warn(
      '[Silva Family Gallery] VITE_SUPABASE_URL looks like a dashboard link. Use https://YOUR_PROJECT_REF.supabase.co',
    )
  }
  if (raw?.includes('/rest/v1')) {
    console.warn(
      '[Silva Family Gallery] VITE_SUPABASE_URL should not include /rest/v1 — use the Project URL only.',
    )
  }
}

warnEnvMisconfiguration()

export const supabase =
  isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
