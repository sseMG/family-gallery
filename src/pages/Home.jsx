import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { formatEventDate, useFamilyEvents } from '../hooks/useFamilyEvents'
import { RecentMemories, FeaturedAlbums, OnThisDay, FamilyMembersPreview } from '../components/home/HomeSections'
import heroBg from '../assets/hero-bg.jpeg'
import heroVideo from '../assets/hero-bg.mp4'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

function UpcomingMoments() {
  const { events, loading, error, fetchEvents } = useFamilyEvents()

  useEffect(() => {
    fetchEvents({ upcomingOnly: true, limit: 3 })
  }, [fetchEvents])

  if (loading || error || events.length === 0) return null

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mt-10 w-full rounded-2xl border border-gold/20 bg-dark/35 p-4 text-left shadow-2xl shadow-black/30 backdrop-blur-md"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold/80">
          Upcoming Moments
        </p>
        <Link to="/calendar" className="text-xs text-cream/45 transition-colors hover:text-gold">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <Link
            key={event.id}
            to="/calendar"
            className="flex items-center gap-3 rounded-lg border border-gold/10 bg-black/20 p-3 transition-colors hover:border-gold/30 hover:bg-gold/10"
          >
            <CalendarDays className="h-5 w-5 shrink-0 text-gold/70" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-cream">{event.title}</p>
              <p className="text-xs text-cream/45">{formatEventDate(event.event_date)}</p>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

export default function Home() {
  return (
    <>
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden sm:min-h-[calc(100vh-4.5rem)]">

      {/* Layer 1 - Background photo */}
      <div
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'absolute',
          inset: 0,
          zIndex: 1,
        }}
      />

      {/* Layer 2 - Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background: 'rgba(0,0,0,0.5)',
        }}
      />

      {/* Layer 4 - Content */}
      <section
        style={{ position: 'relative', zIndex: 4 }}
        className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-5 py-12 text-center sm:px-8 lg:py-16 lg:pl-10 lg:pr-6 lg:text-left"
      >
        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <motion.div
            className="flex max-w-2xl flex-col items-center lg:items-start"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              variants={fadeUp}
              className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold sm:text-sm"
            >
              Welcome home
            </motion.p>

          <motion.h1
            variants={fadeUp}
            className="font-serif text-4xl font-bold leading-[1.1] text-gold sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Silva Family
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-lg text-base leading-relaxed text-cream sm:text-lg"
          >
            A living archive of the moments that shaped us — holidays, milestones,
            and everyday joy, preserved in warmth and light. eme lang
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link
              to="/gallery"
              className="pointer-events-auto mt-10 inline-flex items-center justify-center rounded border border-gold bg-gold/15 px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Explore the Gallery
            </Link>
          </motion.div>
          <UpcomingMoments />
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-gold/30 bg-dark/35 p-2 shadow-2xl shadow-black/40 backdrop-blur-md sm:max-w-md lg:max-w-lg"
          >
            <video
              className="aspect-video w-full rounded-xl object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
              poster={heroBg}
            >
              <source src={heroVideo} type="video/mp4" />
            </video>
          </motion.div>
        </div>
      </section>
    </main>

    {/* Scroll-down sections */}
    <div className="bg-dark">
      <div className="mx-auto border-t border-gold/10">
        <RecentMemories />
      </div>
      <div className="mx-auto border-t border-gold/10">
        <FeaturedAlbums />
      </div>
      <div className="mx-auto border-t border-gold/10">
        <OnThisDay />
      </div>
      <div className="mx-auto border-t border-gold/10">
        <FamilyMembersPreview />
      </div>
    </div>
    </>
  )
}