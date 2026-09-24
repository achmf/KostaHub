'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { palette, KostaButton } from '@/components/KostaUI'

export type FilterOption = {
  value: string
  label: string
}

export type FilterGroup = {
  paramName: string
  title: string
  options: FilterOption[]
}

interface FilterSheetProps {
  filters: FilterGroup[]
}

export function FilterSheet({ filters }: FilterSheetProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [localState, setLocalState] = useState<Record<string, string>>({})
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync state from URL when opening
  useEffect(() => {
    if (isOpen) {
      const state: Record<string, string> = {}
      filters.forEach(f => {
        state[f.paramName] = searchParams.get(f.paramName) || 'ALL'
      })
      setLocalState(state)
    }
  }, [isOpen, searchParams, filters])

  // Count active filters based on URL (not local state)
  const activeCount = filters.reduce((acc, filter) => {
    const val = searchParams.get(filter.paramName)
    return acc + (val && val !== 'ALL' ? 1 : 0)
  }, 0)

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    filters.forEach(f => {
      const val = localState[f.paramName]
      if (!val || val === 'ALL') {
        params.delete(f.paramName)
      } else {
        params.set(f.paramName, val)
      }
    })
    
    // Always reset pagination when filtering
    params.delete('page')
    
    router.replace(`?${params.toString()}`, { scroll: false })
    setIsOpen(false)
  }

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString())
    filters.forEach(f => {
      params.delete(f.paramName)
    })
    params.delete('page')
    router.replace(`?${params.toString()}`, { scroll: false })
    setIsOpen(false)
  }

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
  const animationProps = isDesktop
    ? {
        initial: { x: '100%', y: 0 },
        animate: { x: 0, y: 0 },
        exit: { x: '100%', y: 0 },
      }
    : {
        initial: { y: '100%', x: 0 },
        animate: { y: 0, x: 0 },
        exit: { y: '100%', x: 0 },
      }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center shrink-0 cursor-pointer h-10 px-4 sm:px-4 rounded-xl transition-all"
        style={{
          background: activeCount > 0 ? palette.forest : '#fff',
          border: `1px solid ${activeCount > 0 ? palette.forest : palette.borderStrong}`,
          color: activeCount > 0 ? palette.cream : palette.ink,
        }}
        aria-label="Filter"
      >
        <Filter size={16} />
        <span className="hidden sm:inline-block ml-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500 }}>
          Filter
        </span>
        {activeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full"
            style={{
              background: palette.rose,
              color: '#fff',
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {isMounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[100] cursor-pointer"
                style={{ background: 'rgba(13,20,15,0.4)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div
                {...animationProps}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed z-[101] bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-[400px] bg-white md:rounded-l-2xl rounded-t-3xl md:rounded-tr-none flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: palette.border }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: palette.ink }}>Filter Data</div>
                  <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 rounded-full cursor-pointer hover:bg-black/5">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {filters.map((group) => (
                    <div key={group.paramName}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.1em', color: 'rgba(13,20,15,0.50)', marginBottom: 12 }}>
                        {group.title.toUpperCase()}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map(opt => {
                          const isActive = localState[group.paramName] === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setLocalState(prev => ({ ...prev, [group.paramName]: opt.value }))}
                              className="flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all cursor-pointer"
                              style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 13,
                                background: isActive ? palette.ink : 'transparent',
                                color: isActive ? palette.cream : palette.ink,
                                borderColor: isActive ? palette.ink : palette.border,
                              }}
                            >
                              {isActive && <Check size={14} />}
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t flex gap-3" style={{ borderColor: palette.border, background: '#fff' }}>
                  <KostaButton variant="outline" className="flex-1 justify-center" onClick={handleReset}>
                    Reset
                  </KostaButton>
                  <KostaButton className="flex-1 justify-center" onClick={handleApply}>
                    Terapkan
                  </KostaButton>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
