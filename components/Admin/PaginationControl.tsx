'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

const palette = {
  ink: '#0D140F',
  moss: '#3F5B3A',
  cream: '#F2EDE0',
  border: 'rgba(13,20,15,0.09)',
}

export default function PaginationControl({ 
  page, 
  totalPages, 
  onPrev, 
  onNext 
}: { 
  page: number, 
  totalPages: number, 
  onPrev: () => void, 
  onNext: () => void 
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center gap-3 mt-4 justify-end">
      <button 
        onClick={onPrev} 
        disabled={page === 0}
        className="p-1.5 rounded-md hover:bg-black/5 disabled:opacity-30 transition-all cursor-pointer"
      >
        <ChevronLeft size={16} style={{ color: palette.ink }} />
      </button>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(13,20,15,0.6)' }}>
        {page + 1} / {totalPages}
      </span>
      <button 
        onClick={onNext} 
        disabled={page >= totalPages - 1}
        className="p-1.5 rounded-md hover:bg-black/5 disabled:opacity-30 transition-all cursor-pointer"
      >
        <ChevronRight size={16} style={{ color: palette.ink }} />
      </button>
    </div>
  )
}
