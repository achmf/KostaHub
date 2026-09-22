'use client'

import { motion } from 'framer-motion'

// Simplified: 200ms opacity-only transition (no GPU-expensive blur)
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
