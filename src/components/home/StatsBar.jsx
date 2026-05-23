import { useEffect } from 'react'
import { motion } from 'framer-motion'
import AnimatedNumber from '../ui/AnimatedNumber'
import { useStats } from '../../hooks/useStats'

function StatItem({ label, value, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center rounded-lg border border-gold/15 bg-dark/60 px-6 py-5 backdrop-blur-sm sm:px-8"
    >
      <AnimatedNumber
        value={value}
        className="font-serif text-3xl font-bold text-gold sm:text-4xl"
      />
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-cream/50">
        {label}
      </p>
    </motion.div>
  )
}

export default function StatsBar() {
  const { stats, loading, error, fetchStats } = useStats()

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (error && !loading) {
    return (
      <p className="text-center text-sm text-cream/40">
        Stats unavailable — check Supabase connection.
      </p>
    )
  }

  return (
    <div className="relative z-10 mx-auto grid w-full max-w-3xl grid-cols-3 gap-4 px-5 sm:gap-6">
      <StatItem label="Photos" value={loading ? 0 : stats.photos} delay={0.2} />
      <StatItem label="Albums" value={loading ? 0 : stats.albums} delay={0.35} />
      <StatItem label="Members" value={loading ? 0 : stats.members} delay={0.5} />
    </div>
  )
}
