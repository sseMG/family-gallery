import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const linkClass = ({ isActive }) =>
  `text-sm font-medium tracking-wide transition-colors duration-200 ${
    isActive ? 'text-gold' : 'text-cream/70 hover:text-gold'
  }`

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-gold/15 bg-dark shadow-lg shadow-black/30">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[4.5rem] sm:px-8 lg:px-10">
        <Link
          to="/"
          className="font-serif text-2xl font-semibold tracking-tight text-gold transition-opacity hover:opacity-90"
        >
          Silva Family
        </Link>

        <ul className="flex items-center gap-6 sm:gap-10">
          <li>
            <NavLink to="/gallery" className={linkClass}>
              Gallery
            </NavLink>
          </li>
          <li>
            <NavLink to="/timeline" className={linkClass}>
              Timeline
            </NavLink>
          </li>
          <li>
            <NavLink to="/albums" className={linkClass}>
              Albums
            </NavLink>
          </li>
          {isAdmin ? (
            <li>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-sm font-medium tracking-wide text-cream/70 transition-colors hover:text-gold"
              >
                Sign out
              </button>
            </li>
          ) : (
            <li>
              <NavLink to="/login" className={linkClass}>
                {user ? 'Account' : 'Admin'}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}
