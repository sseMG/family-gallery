import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('logo') // 'logo' | 'text' | 'exit'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 1200)
    const t2 = setTimeout(() => setPhase('exit'), 3800)
    const t3 = setTimeout(() => onComplete?.(), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: 'easeInOut' } }}
          onAnimationComplete={() => phase === 'exit' && setPhase('done')}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#0d0d0d' }}
        >
          {/* Grain texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />

          {/* Radial glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,169,110,0.08) 0%, transparent 70%)',
            }}
          />

          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-gold/10"
                initial={{ width: 80, height: 80, opacity: 0 }}
                animate={{
                  width: 80 + i * 120,
                  height: 80 + i * 120,
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                style={{ borderColor: '#c9a96e' }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-6">

            {/* Logo circle */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-24 w-24 items-center justify-center rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(201,169,110,0.2), rgba(201,169,110,0.05))',
                border: '1px solid rgba(201,169,110,0.4)',
                boxShadow: '0 0 60px rgba(201,169,110,0.15), inset 0 0 30px rgba(201,169,110,0.05)',
              }}
            >
              <motion.span
                className="font-serif text-4xl font-bold"
                style={{ color: '#c9a96e' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                S
              </motion.span>

              {/* Rotating border */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(201,169,110,0.6) 20%, transparent 40%)',
                  borderRadius: '50%',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>

            {/* Family name */}
            <AnimatePresence>
              {(phase === 'text' || phase === 'exit') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.h1
                    className="font-serif text-4xl font-bold tracking-wide"
                    style={{ color: '#c9a96e' }}
                  >
                    Silva Family
                  </motion.h1>
                  <motion.div
                    className="h-px w-32"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }}
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-xs font-medium uppercase tracking-[0.4em]"
                    style={{ color: 'rgba(245,240,232,0.4)' }}
                  >
                    Family Gallery
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading dots */}
            <AnimatePresence>
              {(phase === 'text' || phase === 'exit') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-1.5"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1 w-1 rounded-full"
                      style={{ background: '#c9a96e' }}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom text */}
          <AnimatePresence>
            {(phase === 'text' || phase === 'exit') && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute bottom-12 text-xs tracking-widest"
                style={{ color: 'rgba(245,240,232,0.2)' }}
              >
                PRESERVING MEMORIES
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}