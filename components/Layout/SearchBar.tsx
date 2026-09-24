'use client'

import { Search } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { palette } from '@/components/KostaUI'

export function SearchBar({ placeholder = "Cari..." }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const urlQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(urlQuery)

  useEffect(() => {
    if (query !== urlQuery) {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (query) {
          params.set('q', query)
        } else {
          params.delete('q')
        }
        params.delete('page') // Reset pagination when searching
        
        router.replace(`${pathname}?${params.toString()}`)
      }, 400)
      
      return () => clearTimeout(timer)
    }
  }, [query, urlQuery, pathname, router, searchParams])

  // Sync input value if URL changes externally (e.g. back button)
  useEffect(() => {
    setQuery(urlQuery)
  }, [urlQuery])

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-full w-full sm:max-w-xs transition-colors focus-within:bg-white"
      style={{
        background: 'rgba(13,20,15,0.04)',
        border: `1px solid ${palette.border}`,
      }}
    >
      <Search size={14} style={{ opacity: 0.5, color: palette.ink }} />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-transparent outline-none w-full"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}
      />
    </div>
  )
}
