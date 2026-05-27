import { useEffect } from 'react'
import {
  motion,
  useSpring,
  useTransform,
  useMotionValue,
} from 'framer-motion'

export default function AnimatedNumber({
  value,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
  durationConfig = {
    stiffness: 60,
    damping: 18,
  },
}) {
  const motionValue = useMotionValue(0)

  const spring = useSpring(motionValue, durationConfig)

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  const display = useTransform(spring, (current) => {
    return `${prefix}${Number(current)
      .toFixed(decimals)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`
  })

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  )
}