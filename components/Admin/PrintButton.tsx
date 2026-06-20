'use client'

import { Download } from 'lucide-react'

const palette = {
  forest: '#1B2A1F',
  ochre: '#C7873E',
  moss: '#3F5B3A',
  cream: '#F2EDE0',
  border: 'rgba(13,20,15,0.09)',
  ink: '#0D140F',
}

const EXPORT_OPTIONS = [
  { label: 'Export Farm', type: 'farms', accent: palette.ochre },
  { label: 'Export Hewan', type: 'hewan', accent: palette.moss },
  { label: 'Export User', type: 'users', accent: '#2C5F8A' },
  { label: 'Semua Data', type: 'all', accent: palette.forest },
]

export default function ExportButton() {
  return (
    <div className="flex flex-wrap gap-2">
      {EXPORT_OPTIONS.map((opt) => (
        <a
          key={opt.type}
          href={`/api/admin/export?type=${opt.type}`}
          download
          className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all hover:opacity-80 no-print"
          style={{
            background: opt.type === 'all' ? palette.forest : '#fff',
            color: opt.type === 'all' ? palette.cream : palette.ink,
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
            cursor: 'pointer',
            border: `1px solid ${opt.type === 'all' ? palette.forest : palette.border}`,
            textDecoration: 'none',
          }}
        >
          <Download
            size={13}
            style={{ color: opt.type === 'all' ? 'rgba(242,237,224,0.7)' : opt.accent }}
          />
          {opt.label} <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, opacity: 0.6 }}>.xlsx</span>
        </a>
      ))}
    </div>
  )
}
