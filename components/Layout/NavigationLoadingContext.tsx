'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface NavLoadingContextType {
  startNavigation: () => void
}

const NavLoadingContext = createContext<NavLoadingContextType | undefined>(undefined)

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  // Auto-dismiss when pathname changes (navigation completed)
  useEffect(() => {
    setLoading(false)
  }, [pathname])

  const startNavigation = useCallback(() => setLoading(true), [])

  return (
    <NavLoadingContext.Provider value={{ startNavigation }}>
      {children}
      {loading && <NavigationOverlay />}
    </NavLoadingContext.Provider>
  )
}

function NavigationOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        background: 'rgba(242,237,224,0.75)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // ponytail: no animation library needed, CSS keyframe via style tag below
      }}
    >
      <Spinner />
    </div>
  )
}

function Spinner() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      style={{ animation: 'kosta-spin 0.7s linear infinite' }}
    >
      <style>{`@keyframes kosta-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="16" cy="16" r="12" stroke="rgba(13,20,15,0.12)" strokeWidth="2.5" />
      <path
        d="M16 4a12 12 0 0 1 12 12"
        stroke="#3F5B3A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function useNavigationLoading() {
  const ctx = useContext(NavLoadingContext)
  if (!ctx) throw new Error('useNavigationLoading must be used within NavigationLoadingProvider')
  return ctx.startNavigation
}
