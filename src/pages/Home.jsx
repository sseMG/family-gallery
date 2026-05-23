import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Scene from '../components/three/Scene'
import StatsBar from '../components/home/StatsBar'

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

export default function Home() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-dark sm:min-h-[calc(100vh-4.5rem)]">
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-gold/10 via-dark/50 to-dark" />
      <div className="pointer-events-none absolute -right-1/4 top-0 z-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.08)_0%,transparent_65%)]" />

      <div className="pointer-events-none absolute inset-0 z-0 opacity-90 lg:left-1/3">
        <Scene />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-5 py-12 text-center sm:px-8 lg:items-start lg:py-16 lg:pl-10 lg:pr-6 lg:text-left">
        <motion.div
          className="relative z-10 flex max-w-2xl flex-col items-center lg:items-start"
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
            and everyday joy, preserved in warmth and light.
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link
              to="/gallery"
              className="pointer-events-auto mt-10 inline-flex items-center justify-center rounded border border-gold bg-gold/15 px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Explore the Gallery
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="pointer-events-auto relative z-10 mt-14 w-full lg:mt-16"
        >
          <StatsBar />
        </motion.div>
      </section>
    </main>
  )
}
