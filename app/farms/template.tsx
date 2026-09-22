'use client'

import { motion } from 'framer-motion'

const TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }

// Framer Motion v12 crashes ("frame.join is not a function") ketika filter dan opacity
// dianimasi bersamaan pada satu motion.div. Solusi: pisahkan ke dua layer.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION}
      className="h-full"
    >
      <motion.div
        initial={{ filter: 'blur(4px)' }}
        animate={{ filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
        transition={TRANSITION}
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
