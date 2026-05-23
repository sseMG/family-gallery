import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!supabase) {
      setLoading(false)
      setError(
        'Sign-in is unavailable. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
      )
      return
    }

    const { error: authError } = await signIn(email, password)

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    navigate('/gallery')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-cream/50">
            Sign in to manage your family gallery
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-gold/15 bg-dark p-8 shadow-2xl shadow-black/40"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-sm border border-gold/20 bg-dark px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30"
              placeholder="you@family.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gold/80"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-sm border border-gold/20 bg-dark px-4 py-3 text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400/90" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm border border-gold/40 bg-gold/15 py-3 text-sm font-medium tracking-wide text-gold transition-all duration-300 hover:border-gold hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center font-serif text-lg text-gold/60">Silva Family</p>
      </motion.div>
    </main>
  )
}
