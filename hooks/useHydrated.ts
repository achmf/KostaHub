'use client'

import { useState, useEffect } from 'react'

/**
 * Returns `false` during SSR and before hydration, `true` after.
 * 
 * Use with framer-motion's `initial` prop to prevent SSR from
 * serializing invisible inline styles (opacity:0, etc.):
 * 
 *   const hydrated = useHydrated()
 *   <motion.div initial={hydrated ? { opacity: 0 } : false} animate={{ opacity: 1 }} />
 * 
 * When `initial` is `false`, framer-motion renders directly in
 * the `animate` state — so SSR output is always visible even
 * if JS bundles fail to load (tunnels, slow networks, etc.).
 */

let _hydrated = false

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(_hydrated)
  useEffect(() => {
    _hydrated = true
    setHydrated(true)
  }, [])
  return hydrated
}
