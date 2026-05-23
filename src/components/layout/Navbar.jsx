import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Upload, Heart } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../store'

const linkClass = ({ isActive }) =>
  `text-sm font-medium tracking-wide transition-colors duration-200 ${
    isActive ? 'text-gold' : 'text-cream/70 hover:text-gold'
  }`

const mobileLinkClass = ({ isActive }) =>
  `block py-2 text-base font-medium tracking-wide ${
    isActive ? 'text-gold' : 'text-cream/80 hover:text-gold'
  }`

function UserBadge({ user }) {
  const initial = (user.email?.[0] || 'S').toUpperCase()
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0]

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-gold/15 font-serif text-sm font-semibold text-gold">
        {initial}
      </div>
      <span className="hidden max-w-[140px] truncate text-sm text-cream/80 lg:inline">
        {name}
      </span>
    </div>
  )
}

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const setUploadModalOpen = useStore((s) => s.setUploadModalOpen)
  const [menuOpen, setMenuOpen] = useState(false)

  const openUpload = () => {
    setMenuOpen(false)
    setUploadModalOpen(true)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gold/15 bg-dark shadow-lg shadow-black/30">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8 lg:px-10">
        <Link
          to="/"
          className="shrink-0 font-serif text-xl font-semibold tracking-tight text-gold transition-opacity hover:opacity-90 sm:text-2xl"
        >
          Silva Family
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <NavLink to="/gallery" className={linkClass}>
            Gallery
          </NavLink>
          <NavLink to="/timeline" className={linkClass}>
            Timeline
          </NavLink>
          <NavLink to="/albums" className={linkClass}>
            Albums
          </NavLink>
          <NavLink to="/favorites" className={linkClass}>
            Favorites
          </NavLink>

          {isAdmin && (
            <button
              type="button"
              onClick={openUpload}
              className="inline-flex items-center gap-1.5 rounded border border-gold/35 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold/20"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </button>
          )}

          {isAdmin && user ? (
            <div className="flex items-center gap-4">
              <UserBadge user={user} />
              <button
                type="button"
                onClick={() => signOut()}
                className="text-sm text-cream/60 transition-colors hover:text-gold"
              >
                Sign out
              </button>
            </div>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          {isAdmin && (
            <button
              type="button"
              onClick={openUpload}
              className="rounded border border-gold/35 p-2 text-gold"
              aria-label="Upload photo"
            >
              <Upload className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded border border-gold/25 p-2 text-cream"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-gold/15 bg-dark px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/gallery" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>
              Gallery
            </NavLink>
            <NavLink to="/timeline" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>
              Timeline
            </NavLink>
            <NavLink to="/albums" className={mobileLinkClass} onClick={() => setMenuOpen(false)}>
              Albums
            </NavLink>
            <NavLink
              to="/favorites"
              className={mobileLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              <span className="inline-flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Favorites
              </span>
            </NavLink>
          </div>

          <div className="mt-4 border-t border-gold/10 pt-4">
            {isAdmin && user ? (
              <div className="space-y-3">
                <UserBadge user={user} />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    signOut()
                  }}
                  className="text-sm text-cream/60 hover:text-gold"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={mobileLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Admin login
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
