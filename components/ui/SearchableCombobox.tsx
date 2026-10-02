'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string
}

interface SearchableComboboxProps {
  name: string
  options: ComboboxOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  required?: boolean
}

export function SearchableCombobox({
  name,
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  emptyText = 'Tidak ditemukan.',
  className,
  required
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value || '')
  const [search, setSearch] = useState('')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const currentValue = value !== undefined ? value : internalValue

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    const handleScroll = (e: Event) => {
      const target = e.target as Node
      // Ignore scroll if it's inside the dropdown itself
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return
      }
      updatePosition()
    }
    
    const handleResize = () => {
      updatePosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true) // capture phase to get all scrolls
    window.addEventListener('resize', handleResize)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  )

  const selectedOption = options.find(o => o.value === currentValue)

  const handleSelect = (val: string) => {
    setInternalValue(val)
    onChange?.(val)
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleSelect('')
  }

  const renderDropdown = () => (
    <div 
      ref={dropdownRef}
      className="fixed mt-1 overflow-y-auto overscroll-contain rounded-xl border border-[rgba(13,20,15,0.12)] bg-white shadow-lg p-1"
      style={{ 
        top: coords.top, 
        left: coords.left, 
        width: coords.width, 
        maxHeight: '240px',
        zIndex: 99999,
        visibility: coords.width === 0 ? 'hidden' : 'visible'
      }}
    >
      {filteredOptions.length === 0 ? (
         <div className="py-4 text-center text-[13px] text-gray-500">{emptyText}</div>
      ) : (
         filteredOptions.map(o => (
           <div 
             key={o.value}
             onClick={() => handleSelect(o.value)}
             className="flex items-center px-2 py-2 cursor-pointer hover:bg-[rgba(13,20,15,0.04)] rounded-lg text-[13px] transition-colors"
           >
             <Check className={cn("mr-2 h-4 w-4 shrink-0", currentValue === o.value ? "opacity-100" : "opacity-0")} />
             <span className="truncate">{o.label} {o.sublabel && <span className="opacity-50 ml-1">({o.sublabel})</span>}</span>
           </div>
         ))
      )}
    </div>
  )

  return (
    <div className="relative w-full" ref={containerRef}>
      <input type="hidden" name={name} value={currentValue} required={required} />
      
      <div 
        className={cn(
          "flex h-[42px] w-full items-center justify-between rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white px-3 text-[14px] outline-none transition-all shadow-sm cursor-text",
          isOpen ? "border-[#C7873E] ring-4 ring-[rgba(199,135,62,0.12)]" : "hover:bg-[rgba(13,20,15,0.02)]",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        {currentValue && !isOpen ? (
          <div className="flex-1 flex items-center justify-between min-w-0 pr-2">
             <span className="truncate">{selectedOption?.label}</span>
             <button type="button" onClick={handleClear} className="text-gray-400 hover:text-[rgba(13,20,15,0.8)] px-1 shrink-0 ml-2 focus:outline-none">
               <X size={14} />
             </button>
          </div>
        ) : (
          <input 
            type="text" 
            className="w-full bg-transparent outline-none h-full placeholder:text-gray-400" 
            placeholder={currentValue ? selectedOption?.label : (isOpen ? searchPlaceholder : placeholder)} 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
          />
        )}
        {!currentValue || isOpen ? <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /> : null}
      </div>

      {isOpen && typeof document !== 'undefined' ? createPortal(renderDropdown(), document.body) : null}
    </div>
  )
}
