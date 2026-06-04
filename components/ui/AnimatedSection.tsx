'use client'

import { motion, type Variants, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export const AnimatedSection = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <motion.div ref={ref} variants={itemVariants} className={className} {...props}>
        {children}
      </motion.div>
    )
  }
)
AnimatedSection.displayName = 'AnimatedSection'
