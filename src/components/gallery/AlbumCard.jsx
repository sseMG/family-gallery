import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const PLACEHOLDER_COVER =
  'https://picsum.photos/seed/silva-album/700/525'

export default function AlbumCard({ album, index = 0 }) {
  const count = album.photo_count ?? 0
  const cover = album.cover_url || PLACEHOLDER_COVER

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
    >
      <Link
        to={`/album/${album.id}`}
        className="group block overflow-hidden rounded-xl border border-gold/10 bg-dark/40 transition-all duration-300 hover:border-gold/50 hover:shadow-[0_0_28px_rgba(201,169,110,0.18)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={cover}
            alt={album.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent" />
          {album.year != null && (
            <span className="absolute right-3 top-3 rounded border border-gold/30 bg-dark/80 px-2 py-0.5 text-xs font-medium tracking-wider text-gold">
              {album.year}
            </span>
          )}
        </div>

        <div className="border-t border-gold/10 p-4 sm:p-5">
          <h3 className="font-serif text-xl text-gold transition-colors group-hover:text-cream sm:text-2xl">
            {album.title}
          </h3>
          <p className="mt-1 text-sm text-cream/50">
            {count} {count === 1 ? 'photo' : 'photos'}
          </p>
          {album.description && (
            <p className="mt-2 line-clamp-2 text-sm text-cream/40">{album.description}</p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
