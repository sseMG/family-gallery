import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export default function AnimatedNumber({ value, className = '' }) {
  const spring = useSpring(0, { stiffness: 60, damping: 18 })

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())

  return <motion.span className={className}>{display}</motion.span>
}
