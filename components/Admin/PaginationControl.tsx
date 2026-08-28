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
  onNext,
  totalItems,
  perPage,
}: { 
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  totalItems?: number
  perPage?: number
}) {
  if (totalPages <= 1) return null

  const start = totalItems && perPage ? page * perPage + 1 : null
  const end = totalItems && perPage ? Math.min((page + 1) * perPage, totalItems) : null

  return (
    <div className="flex items-center gap-3 mt-4 justify-end">
      {start !== null && (
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
          {start}–{end} dari {totalItems}
        </span>
      )}
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
