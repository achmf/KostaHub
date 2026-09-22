'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Tooltip shown beside an icon when the sidebar is collapsed.
 * Appears on hover, slides in from the left.
 */
export function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 z-50 ml-3"
          >
            <div
              className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs"
              style={{
                background: '#1B2A1F',
                color: '#F2EDE0',
                fontFamily: "'Inter',sans-serif",
                border: '1px solid rgba(242,237,224,0.12)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              }}
            >
              {label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
