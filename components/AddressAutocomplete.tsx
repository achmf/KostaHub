'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { palette } from '@/components/KostaUI'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface Props {
  /** Controlled value — parent owns the state */
  value: string
  onChange: (val: string) => void
  /** Fired when a suggestion is explicitly chosen */
  onSelect: (address: string, lat: number, lng: number) => void
  placeholder?: string
}



export default function AddressAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=id`,
        { headers: { 'Accept-Language': 'id' } }
      )
      const data: NominatimResult[] = await res.json()
      setSuggestions(data)
      setShowDropdown(data.length > 0)
    } catch {
      setSuggestions([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value
    onChange(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(text), 500)
  }

  function handleSelect(result: NominatimResult) {
    setSuggestions([])
    setShowDropdown(false)
    onChange(result.display_name)
    onSelect(result.display_name, parseFloat(result.lat), parseFloat(result.lon))
  }

  function handleClear() {
    onChange('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const hasSuggestions = showDropdown && suggestions.length > 0

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Text input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder ?? 'Ketik nama jalan, desa, atau kota…'}
          autoComplete="off"
          className="w-full px-4 py-3 rounded-xl transition-all"
          style={{
            paddingRight: (value || isLoading) ? 68 : 16,
            background: 'rgba(13,20,15,0.03)',
            border: `1px solid ${palette.border}`,
            fontFamily: "'Inter',sans-serif",
            fontSize: 14,
            color: palette.ink,
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = palette.ochre
            e.currentTarget.style.background = '#fff'
            if (suggestions.length > 0) setShowDropdown(true)
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = palette.border
            e.currentTarget.style.background = 'rgba(13,20,15,0.03)'
          }}
        />

        {/* Right-side icons */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5"
          style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
        >
          {isLoading && (
            <Loader2 size={14} className="animate-spin" style={{ color: palette.ochre }} />
          )}
          {value && !isLoading && (
            <button
              type="button"
              onMouseDown={handleClear}
              className="cursor-pointer w-5 h-5 flex items-center justify-center rounded-full transition-colors"
              style={{ color: 'rgba(13,20,15,0.35)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(13,20,15,0.7)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(13,20,15,0.35)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {hasSuggestions && (
        <div
          className="absolute left-0 right-0"
          style={{
            top: 'calc(100% + 6px)',
            background: '#fff',
            border: `1px solid ${palette.border}`,
            borderRadius: 14,
            overflow: 'hidden',
            zIndex: 999,
            boxShadow: '0 8px 32px rgba(13,20,15,0.12), 0 2px 6px rgba(13,20,15,0.06)',
          }}
        >
          <div
            style={{
              padding: '7px 14px 5px',
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.15em',
              color: 'rgba(13,20,15,0.35)',
              borderBottom: `1px solid ${palette.border}`,
            }}
          >
            HASIL PENCARIAN · NOMINATIM
          </div>

          {suggestions.map((result, idx) => (
            <button
              key={result.place_id}
              type="button"
              onMouseDown={() => handleSelect(result)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer"
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
                color: palette.ink,
                lineHeight: 1.45,
                borderBottom: idx < suggestions.length - 1 ? `1px solid ${palette.border}` : 'none',
                background: 'transparent',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(199,135,62,0.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <MapPin
                size={13}
                style={{ color: palette.ochre, marginTop: 2, flexShrink: 0 }}
              />
              <span>{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
