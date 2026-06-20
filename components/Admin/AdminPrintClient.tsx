'use client'

import { Printer } from 'lucide-react'

interface PrintClientProps {
  reportDate: string
  stats: {
    totalFarm: number
    farmAktif: number
    totalUser: number
    totalHewan: number
    totalMati: number
    totalTerjual: number
    mortalityRate: number
    pendingApprovals: number
    farmBulanIni: number
    hewanBulanIni: number
    birthSuccessRate: number
  }
  farms: {
    id: string
    nama: string
    status: string
    alamat: string
    hewan: number
    members: number
    createdAt: string
  }[]
  kategoriData: { name: string; value: number }[]
}

const KATEGORI_LABELS: Record<string, string> = {
  INDUKAN: 'Indukan',
  PEJANTAN: 'Pejantan',
  ANAKAN: 'Anakan',
  DARA: 'Dara',
  JANTAN_MUDA: 'Jantan Muda',
}

export default function AdminPrintClient({ reportDate, stats, farms, kategoriData }: PrintClientProps) {
  const date = new Date(reportDate)
  const formatted = date.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div>
      {/* Print button — hidden in print mode */}
      <div className="print:hidden mb-6 flex items-center gap-3">
        <button
          onClick={() => window.print()}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-full transition-all hover:opacity-90"
          style={{
            background: '#1B2A1F',
            color: '#F2EDE0',
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
          }}
        >
          <Printer size={14} />
          Cetak / Simpan PDF
        </button>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
          Gunakan Ctrl+P atau tombol di atas untuk mencetak
        </span>
      </div>

      {/* Print Body */}
      <div
        id="print-report"
        className="bg-white"
        style={{
          fontFamily: "'Inter',sans-serif",
          color: '#0D140F',
          maxWidth: 900,
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '2px solid #0D140F', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', opacity: 0.5, marginBottom: 4 }}>
            KOSTAHUB — LAPORAN ADMINISTRASI
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 400, margin: 0 }}>
            Laporan Sistem Peternakan
          </h1>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            Dicetak pada: {formatted}
          </div>
        </div>

        {/* KPI Summary */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', opacity: 0.5, marginBottom: 12 }}>
            RINGKASAN UTAMA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Farm', value: stats.totalFarm, sub: `${stats.farmAktif} aktif` },
              { label: 'Total Hewan', value: stats.totalHewan, sub: 'hewan aktif' },
              { label: 'Total User', value: stats.totalUser, sub: 'pengguna terdaftar' },
              { label: 'Mortality Rate', value: `${stats.mortalityRate}%`, sub: `${stats.totalMati} mati` },
              { label: 'Farm Baru (bln ini)', value: stats.farmBulanIni, sub: 'bulan berjalan' },
              { label: 'Hewan Baru (bln ini)', value: stats.hewanBulanIni, sub: 'bulan berjalan' },
              { label: 'Keberhasilan Repro', value: `${stats.birthSuccessRate}%`, sub: 'tingkat lahir' },
              { label: 'Pending Persetujuan', value: stats.pendingApprovals, sub: 'farm menunggu' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                style={{ border: '1px solid rgba(13,20,15,0.1)', borderRadius: 10, padding: '12px 14px' }}
              >
                <div style={{ fontSize: 22, fontFamily: "'Fraunces',serif", fontWeight: 400 }}>{kpi.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.15em', opacity: 0.5, marginTop: 4 }}>
                  {kpi.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{kpi.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Kategori Hewan */}
        {kategoriData.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', opacity: 0.5, marginBottom: 12 }}>
              DISTRIBUSI KATEGORI HEWAN
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {kategoriData.map((k) => (
                <div
                  key={k.name}
                  style={{ border: '1px solid rgba(13,20,15,0.1)', borderRadius: 8, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center' }}
                >
                  <span style={{ fontSize: 16, fontFamily: "'Fraunces',serif" }}>{k.value}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{KATEGORI_LABELS[k.name] ?? k.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Farm Table */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', opacity: 0.5, marginBottom: 12 }}>
            DAFTAR FARM ({farms.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(13,20,15,0.15)' }}>
                {['No', 'Nama Farm', 'Status', 'Alamat', 'Hewan', 'Member', 'Terdaftar'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      opacity: 0.5,
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {farms.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: '1px solid rgba(13,20,15,0.06)' }}>
                  <td style={{ padding: '8px 10px', opacity: 0.4, fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>{i + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 500 }}>{f.nama}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                      background: f.status === 'AKTIF' ? 'rgba(63,91,58,0.12)' : 'rgba(181,68,59,0.1)',
                      color: f.status === 'AKTIF' ? '#3F5B3A' : '#B5443B',
                    }}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', opacity: 0.6, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.alamat || '—'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{f.hewan}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{f.members}</td>
                  <td style={{ padding: '8px 10px', opacity: 0.5, fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>
                    {new Date(f.createdAt).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid rgba(13,20,15,0.1)', opacity: 0.4, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.05em' }}>
          KostaHub — Sistem Manajemen Peternakan Regional · Dokumen ini dibuat secara otomatis
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          #print-report { max-width: 100% !important; padding: 0 !important; }
          aside, nav, header { display: none !important; }
        }
      `}</style>
    </div>
  )
}
