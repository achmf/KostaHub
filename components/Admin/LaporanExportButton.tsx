'use client'

import { Download, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'

export default function LaporanExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/export/laporan')
      if (!res.ok) throw new Error('Export gagal')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      a.href     = url
      a.download = `KostaHub-Laporan-Regional-${date}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Gagal mengunduh laporan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      id="btn-export-laporan-excel"
      aria-label={loading ? 'Membuat file...' : 'Export Laporan (.xlsx)'}
      className="min-h-10 md:min-h-0"
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '10px',
        padding:       '10px 20px',
        background:    loading ? 'rgba(27,42,31,0.6)' : '#1B2A1F',
        color:         '#F2EDE0',
        border:        '1px solid rgba(199,135,62,0.3)',
        borderRadius:  '12px',
        fontFamily:    "'Inter', sans-serif",
        fontSize:      13,
        fontWeight:    500,
        cursor:        loading ? 'wait' : 'pointer',
        transition:    'all 0.2s ease',
        whiteSpace:    'nowrap',
      }}
      onMouseEnter={e => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#243326'
      }}
      onMouseLeave={e => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#1B2A1F'
      }}
    >
      {loading ? (
        <>
          <svg
            width="16" height="16" className="md:w-[15px] md:h-[15px]" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'spin 1s linear infinite', opacity: 0.7 }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span style={{ opacity: 0.7 }}>Membuat file...</span>
        </>
      ) : (
        <>
          <FileSpreadsheet size={16} className="md:w-[15px] md:h-[15px]" style={{ color: '#C7873E' }} />
          <span>Export<span className="hidden md:inline"> Laporan</span></span>
          <span
            className="hidden md:inline"
            style={{
              fontFamily:  "'JetBrains Mono', monospace",
              fontSize:    9,
              opacity:     0.55,
              letterSpacing: '0.05em',
            }}
          >
            .xlsx
          </span>
          <Download size={14} className="md:w-[12px] md:h-[12px]" style={{ opacity: 0.5, marginLeft: 2 }} />
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
