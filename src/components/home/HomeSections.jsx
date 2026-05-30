import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Camera, CalendarHeart, Users, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getPhotoDisplayUrl } from '../../lib/photos'

const sectionFade = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

function SectionHeader({ icon: Icon, eyebrow, title, linkTo, linkLabel }) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {eyebrow}
        </p>
        <h2 className="font-serif text-2xl font-bold text-gold sm:text-3xl">{title}</h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="group hidden items-center gap-1.5 text-sm font-medium text-cream/50 transition-colors hover:text-gold sm:inline-flex"
        >
          {linkLabel || 'View all'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}

/* ─── 1. Recent Memories ─── */
export function RecentMemories() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data } = await supabase
        .from('photos')
        .select('id, url, caption, year, aspect, width, height')
        .order('created_at', { ascending: false })
        .limit(6)
      setPhotos(data ?? [])
      setLoading(false)
    })()
  }, [])

  if (!loading && photos.length === 0) return null

  return (
    <motion.section
      variants={sectionFade}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
    >
      <SectionHeader
        icon={Camera}
        eyebrow="Fresh from the gallery"
        title="Recent Memories"
        linkTo="/gallery"
        linkLabel="Browse gallery"
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-gold/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {photos.map((photo, i) => (
            <Link key={photo.id} to="/gallery" className="group">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="relative aspect-square overflow-hidden rounded-xl border border-gold/10 transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_20px_rgba(201,169,110,0.15)]"
              >
                <img
                  src={getPhotoDisplayUrl(photo, 400)}
                  alt={photo.caption || 'Family photo'}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {photo.caption && !/^[\d\s]+n?$/.test(photo.caption) && (
                  <p className="absolute bottom-2 left-2 right-2 truncate text-xs text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {photo.caption}
                  </p>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      <Link
        to="/gallery"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cream/50 transition-colors hover:text-gold sm:hidden"
      >
        Browse gallery <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.section>
  )
}

/* ─── 2. Our Albums ─── */
export function FeaturedAlbums() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      // Fetch 3 most recent albums with cover fallback
      const { data: albumData } = await supabase
        .from('albums')
        .select('id, title, description, year, cover_url')
        .order('year', { ascending: false })
        .limit(3)

      if (!albumData || albumData.length === 0) {
        setLoading(false)
        return
      }

      // Get photo counts
      const { data: countData } = await supabase
        .from('photos')
        .select('album_id')
        .not('album_id', 'is', null)

      const countMap = {}
      for (const row of countData ?? []) {
        countMap[row.album_id] = (countMap[row.album_id] || 0) + 1
      }

      // Get cover fallbacks for albums missing cover_url
      const needsCover = albumData.filter((a) => !a.cover_url).map((a) => a.id)
      let coverMap = {}
      if (needsCover.length > 0) {
        const { data: coverData } = await supabase
          .from('photos')
          .select('album_id, url')
          .in('album_id', needsCover)
          .order('created_at', { ascending: false })
        for (const row of coverData ?? []) {
          if (!coverMap[row.album_id]) coverMap[row.album_id] = row.url
        }
      }

      setAlbums(
        albumData.map((a) => ({
          ...a,
          cover_url: a.cover_url || coverMap[a.id] || null,
          photo_count: countMap[a.id] || 0,
        })),
      )
      setLoading(false)
    })()
  }, [])

  if (!loading && albums.length === 0) return null

  return (
    <motion.section
      variants={sectionFade}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
    >
      <SectionHeader
        icon={BookOpen}
        eyebrow="Curated collections"
        title="Our Albums"
        linkTo="/albums"
        linkLabel="All albums"
      />

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-gold/5" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album, i) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
            >
              <Link
                to={`/album/${album.id}`}
                className="group block overflow-hidden rounded-xl border border-gold/10 bg-dark/40 transition-all duration-300 hover:border-gold/50 hover:shadow-[0_0_28px_rgba(201,169,110,0.18)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt={album.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gold/5">
                      <BookOpen className="h-10 w-10 text-gold/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent" />
                  {album.year != null && (
                    <span className="absolute right-3 top-3 rounded border border-gold/30 bg-dark/80 px-2 py-0.5 text-xs font-medium tracking-wider text-gold">
                      {album.year}
                    </span>
                  )}
                </div>
                <div className="border-t border-gold/10 p-4 sm:p-5">
                  <h3 className="font-serif text-lg text-gold transition-colors group-hover:text-cream sm:text-xl">
                    {album.title}
                  </h3>
                  <p className="mt-1 text-sm text-cream/50">
                    {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  )
}

/* ─── 3. On This Day ─── */
export function OnThisDay() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const today = new Date()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const currentYear = today.getFullYear()

      // Look for photos whose created_at matches today's month-day in past years
      const { data } = await supabase
        .from('photos')
        .select('id, url, caption, year, aspect, width, height, created_at')
        .order('created_at', { ascending: false })

      const matches = (data ?? []).filter((p) => {
        const d = new Date(p.created_at)
        return (
          d.getFullYear() < currentYear &&
          String(d.getMonth() + 1).padStart(2, '0') === month &&
          String(d.getDate()).padStart(2, '0') === day
        )
      })

      setPhotos(matches.slice(0, 6))
      setLoading(false)
    })()
  }, [])

  if (!loading && photos.length === 0) return null
  if (loading) return null

  return (
    <motion.section
      variants={sectionFade}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
    >
      <SectionHeader
        icon={CalendarHeart}
        eyebrow={`${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} in past years`}
        title="On This Day"
        linkTo="/gallery"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {photos.map((photo, i) => {
          const photoYear = new Date(photo.created_at).getFullYear()
          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-gold/10 transition-all duration-300 hover:border-gold/40"
            >
              <img
                src={getPhotoDisplayUrl(photo, 400)}
                alt={photo.caption || 'Family memory'}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 rounded border border-gold/30 bg-dark/80 px-2 py-0.5 text-xs font-medium text-gold">
                {photoYear}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}

/* ─── 4. Family Members Preview ─── */
export function FamilyMembersPreview() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data } = await supabase
        .from('family_members')
        .select('id, full_name, nickname, avatar_url, relationship')
        .order('created_at', { ascending: true })
        .limit(6)
      setMembers(data ?? [])
      setLoading(false)
    })()
  }, [])

  if (!loading && members.length === 0) return null

  return (
    <motion.section
      variants={sectionFade}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
    >
      <SectionHeader
        icon={Users}
        eyebrow="The people behind the photos"
        title="Meet the Family"
        linkTo="/members"
        linkLabel="View all members"
      />

      {loading ? (
        <div className="flex justify-center gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 w-20 animate-pulse rounded-full bg-gold/5" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
            {members.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group flex flex-col items-center gap-2"
              >
                <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-gold/20 bg-gold/10 shadow-lg transition-all duration-300 group-hover:border-gold/60 group-hover:shadow-[0_0_20px_rgba(201,169,110,0.2)] sm:h-24 sm:w-24">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-serif text-2xl font-bold text-gold/50">
                        {member.full_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-cream">
                    {member.nickname || member.full_name?.split(' ')[0]}
                  </p>
                  <p className="text-xs text-cream/40">{member.relationship}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <Link
            to="/members"
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all duration-300 hover:border-gold hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(201,169,110,0.15)]"
          >
            <Users className="h-4 w-4" />
            Meet the Family
          </Link>
        </div>
      )}
    </motion.section>
  )
}
