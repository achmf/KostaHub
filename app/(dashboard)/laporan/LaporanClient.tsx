'use client'

import { useState, useMemo } from 'react'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'
import {
  FileSpreadsheet, Download, Stethoscope, Calendar, Shield, Search,
  CircleAlert, PawPrint, ArrowUpDown, ArrowUp, ArrowDown,
  Syringe, FlaskConical, Pill, Heart, Scissors,
  Baby, Scale, TrendingUp, TrendingDown, Minus,
  ArrowRightLeft, PackagePlus, PackageMinus, Skull,
  ShoppingCart, ChevronDown, ChevronUp,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { KostaPageHeader, KostaCard, KostaButton, Badge, KostaSectionLabel, palette } from '@/components/KostaUI'

type TabType = 'keluar-masuk' | 'medis' | 'breeding' | 'pertumbuhan'

const KATEGORI_MEDIS_ICON: Record<string, React.ReactNode> = {
  VAKSINASI: <Syringe size={13} />,
  VITAMIN: <FlaskConical size={13} />,
  PENGOBATAN: <Pill size={13} />,
  PEMERIKSAAN: <Stethoscope size={13} />,
  PERAWATAN_LUKA: <Scissors size={13} />,
  LAINNYA: <Heart size={13} />,
}

const KATEGORI_MEDIS_LABEL: Record<string, string> = {
  VAKSINASI: 'Vaksinasi',
  VITAMIN: 'Vitamin',
  PENGOBATAN: 'Pengobatan',
  PEMERIKSAAN: 'Pemeriksaan',
  PERAWATAN_LUKA: 'Perawatan Luka',
  LAINNYA: 'Lainnya',
}

const KATEGORI_MEDIS_COLOR: Record<string, string> = {
  VAKSINASI: palette.moss,
  VITAMIN: palette.ochre,
  PENGOBATAN: palette.rose,
  PEMERIKSAAN: '#5B7FA6',
  PERAWATAN_LUKA: '#B5803B',
  LAINNYA: palette.ink,
}

export default function LaporanClient({ data, isGlobal, farmName, farmId }: { data: any; isGlobal: boolean; farmName: string; farmId?: string | null }) {
  const [tab, setTab] = useState<TabType>('keluar-masuk')
  const [exportLoading, setExportLoading] = useState(false)

  async function handleExport() {
    setExportLoading(true)
    try {
      const params = farmId ? `?farmId=${farmId}` : ''
      const res    = await fetch(`/api/farm/laporan/export${params}`)
      if (!res.ok) throw new Error('Export gagal')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      a.href     = url
      a.download = `KostaHub-Laporan-${farmName.replace(/[^a-zA-Z0-9]/g, '-')}-${date}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Gagal mengunduh laporan. Coba lagi.')
    } finally {
      setExportLoading(false)
    }
  }

  const actionCount =
    (data.hewanPerluPerhatian?.length || 0) +
    (data.kehamilanAktif?.filter((k: any) => {
      const diff = (new Date(k.estimasiLahir).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }).length || 0) +
    (data.jadwalMedis?.filter((j: any) => {
      const diff = (new Date(j.tanggalLanjut).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }).length || 0) +
    (data.inbreedingAlerts?.length || 0)

  const tabs: { key: TabType; label: string; sub: string; count: number }[] = [
    { key: 'keluar-masuk', label: 'Keluar-Masuk Ternak', sub: 'Mutasi, pembelian, kematian', count: data.hewanMasuk?.length ?? 0 },
    { key: 'medis', label: 'Kesehatan & Medis', sub: 'Vaksin, vitamin, pengobatan', count: data.medisData?.length ?? 0 },
    { key: 'breeding', label: 'Kartu Breeding', sub: 'Perkawinan & kelahiran', count: data.breedingData?.length ?? 0 },
    { key: 'pertumbuhan', label: 'Pertumbuhan Bobot', sub: 'Penimbangan berkala', count: data.pertumbuhanData?.length ?? 0 },
  ]

  return (
    <div>
      <KostaPageHeader
        title={isGlobal ? 'Audit Lintas Cabang' : `Laporan ${farmName}`}
        description="Detail rekaman operasional farm — tindakan prioritas dan data ternak per kategori."
        action={
          <button
            id="btn-export-laporan-farm"
            onClick={handleExport}
            disabled={exportLoading}
            style={{
              display:     'inline-flex',
              alignItems:  'center',
              gap:         10,
              padding:     '9px 18px',
              background:  exportLoading ? 'rgba(27,42,31,0.6)' : '#1B2A1F',
              color:       '#F2EDE0',
              border:      '1px solid rgba(199,135,62,0.3)',
              borderRadius: 12,
              fontFamily:  "'Inter', sans-serif",
              fontSize:    13,
              fontWeight:  500,
              cursor:      exportLoading ? 'wait' : 'pointer',
              transition:  'all 0.2s ease',
              whiteSpace:  'nowrap',
            }}
          >
            {exportLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ animation: 'spin 1s linear infinite', opacity: 0.7 }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span style={{ opacity: 0.7 }}>Membuat file...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={14} style={{ color: '#C7873E' }} />
                <span>Export Laporan</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>.xlsx</span>
                <Download size={12} style={{ opacity: 0.45, marginLeft: 2 }} />
              </>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </button>
        }
      />

      {/* ─── ACTION ITEMS ────────────────────────────────── */}
      {actionCount > 0 ? (
        <ActionItemsPanel
          hewanPerluPerhatian={data.hewanPerluPerhatian}
          kehamilanAktif={data.kehamilanAktif}
          jadwalMedis={data.jadwalMedis}
          inbreedingAlerts={data.inbreedingAlerts}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: 'rgba(63,122,78,0.06)', border: '1px solid rgba(63,122,78,0.18)' }}
        >
          <CircleAlert size={14} style={{ color: palette.moss }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
            Tidak ada tindakan prioritas saat ini. Semua kondisi farm dalam keadaan normal.
          </span>
        </motion.div>
      )}

      {/* ─── TAB NAV ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {tabs.map((t, i) => (
          <motion.button
            key={t.key}
            onClick={() => setTab(t.key)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="cursor-pointer rounded-2xl p-4 text-left transition-all"
            style={{
              background: tab === t.key ? palette.ink : '#fff',
              color: tab === t.key ? palette.cream : palette.ink,
              border: `1px solid ${tab === t.key ? palette.ink : palette.border}`,
              boxShadow: tab === t.key ? '0 4px 16px rgba(13,20,15,0.15)' : 'none',
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
              letterSpacing: '0.14em',
              opacity: tab === t.key ? 0.6 : 0.45,
              marginBottom: 6,
            }}>
              {String(i + 1).padStart(2, '0')} / LAPORAN
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
              {t.label}
            </div>
            <div style={{
              fontFamily: "'Inter',sans-serif", fontSize: 11,
              opacity: tab === t.key ? 0.55 : 0.4,
            }}>
              {t.sub}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span style={{
                fontFamily: "'Fraunces',serif", fontSize: 22,
                letterSpacing: '-0.025em',
                color: tab === t.key ? palette.cream : palette.moss,
              }}>
                {t.count}
              </span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, opacity: 0.5 }}>data</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ─── CONTENT ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === 'keluar-masuk' && <LaporanKeluarMasuk key="km" data={data} />}
        {tab === 'medis' && <LaporanMedis key="medis" data={data.medisData} />}
        {tab === 'breeding' && <LaporanBreeding key="breeding" data={data.breedingData} />}
        {tab === 'pertumbuhan' && <LaporanPertumbuhan key="pertumbuhan" data={data.pertumbuhanData} />}
      </AnimatePresence>
    </div>
  )
}

// ─── ACTION ITEMS PANEL ─────────────────────────────────────
function ActionItemsPanel({ hewanPerluPerhatian, kehamilanAktif, jadwalMedis, inbreedingAlerts }: any) {
  const urgentPregnancies = (kehamilanAktif ?? []).filter((k: any) => {
    const diff = (new Date(k.estimasiLahir).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })
  const urgentMedis = (jadwalMedis ?? []).filter((j: any) => {
    const diff = (new Date(j.tanggalLanjut).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })

  const items: { icon: React.ReactNode; text: string; badge: React.ReactNode }[] = []

  if (hewanPerluPerhatian?.length > 0) items.push({
    icon: <Stethoscope size={14} />,
    text: `${hewanPerluPerhatian.length} hewan status ${hewanPerluPerhatian.map((h: any) => h.status).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join('/')} perlu tindakan`,
    badge: <Badge variant="rose">URGENT</Badge>,
  })
  if (urgentPregnancies.length > 0) items.push({
    icon: <PawPrint size={14} />,
    text: `${urgentPregnancies.length} estimasi kelahiran dalam 7 hari ke depan`,
    badge: <Badge variant="amber">SEGERA</Badge>,
  })
  if (urgentMedis.length > 0) items.push({
    icon: <Calendar size={14} />,
    text: `${urgentMedis.length} jadwal kontrol medis minggu ini`,
    badge: <Badge variant="amber">JADWAL</Badge>,
  })
  if (inbreedingAlerts?.length > 0) items.push({
    icon: <Shield size={14} />,
    text: `${inbreedingAlerts.length} pasangan reproduksi terdeteksi risiko inbreeding`,
    badge: <Badge variant="rose">GENETIK</Badge>,
  })

  if (items.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(181,68,59,0.06), rgba(217,162,60,0.06))',
        border: '1px solid rgba(181,68,59,0.15)',
      }}
    >
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(181,68,59,0.1)' }}>
        <CircleAlert size={14} style={{ color: palette.rose }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.12em', color: palette.rose }}>
          PERLU TINDAKAN
        </span>
        <Badge variant="rose">{items.length}</Badge>
      </div>
      <div className="px-5 py-3 grid gap-2">
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 py-1.5"
          >
            <span style={{ color: palette.ink, opacity: 0.5 }}>{item.icon}</span>
            <span className="flex-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>{item.text}</span>
            {item.badge}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── LAPORAN 1: KELUAR-MASUK TERNAK ────────────────────────
function LaporanKeluarMasuk({ data }: { data: any }) {
  const [activeSection, setActiveSection] = useState<'masuk' | 'keluar' | 'mutasi'>('masuk')
  const [search, setSearch] = useState('')

  const hewanMasuk = (data.hewanMasuk ?? []).filter((h: any) => h.status === 'AKTIF')
  const hewanKeluar = (data.hewanMasuk ?? []).filter((h: any) => h.status === 'MATI' || h.status === 'TERJUAL')
  const mutasi = data.mutasiData ?? []

  const sections = [
    { key: 'masuk' as const, label: 'Ternak Masuk / Aktif', icon: <PackagePlus size={13} />, count: hewanMasuk.length, color: palette.moss },
    { key: 'keluar' as const, label: 'Ternak Keluar', icon: <PackageMinus size={13} />, count: hewanKeluar.length, color: palette.rose },
    { key: 'mutasi' as const, label: 'Mutasi / Transfer', icon: <ArrowRightLeft size={13} />, count: mutasi.length, color: palette.ochre },
  ]

  const filteredMasuk = useMemo(() => {
    const q = search.toLowerCase()
    return hewanMasuk.filter((h: any) =>
      !q || h.tag?.toLowerCase().includes(q) || h.nama?.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [hewanMasuk, search])

  const filteredKeluar = useMemo(() => {
    const q = search.toLowerCase()
    return hewanKeluar.filter((h: any) =>
      !q || h.tag?.toLowerCase().includes(q) || h.nama?.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [hewanKeluar, search])

  const filteredMutasi = useMemo(() => {
    const q = search.toLowerCase()
    return mutasi.filter((t: any) =>
      !q || t.tag?.toLowerCase().includes(q) || t.nama?.toLowerCase().includes(q) ||
      t.fromFarm?.toLowerCase().includes(q) || t.toFarm?.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [mutasi, search])

  const masukP = usePagination(filteredMasuk, 20)
  const keluarP = usePagination(filteredKeluar, 20)
  const mutasiP = usePagination(filteredMutasi, 20)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Section toggle */}
      <KostaCard className="mb-4 p-2">
        <div className="grid grid-cols-3 gap-2">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => { setActiveSection(s.key); setSearch('') }}
              className="cursor-pointer rounded-xl px-4 py-3 flex items-center gap-2 transition-all"
              style={{
                background: activeSection === s.key ? s.color : 'transparent',
                color: activeSection === s.key ? '#fff' : palette.ink,
              }}
            >
              <span style={{ opacity: activeSection === s.key ? 1 : 0.5 }}>{s.icon}</span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: activeSection === s.key ? 500 : 400 }}>
                {s.label}
              </span>
              <span className="ml-auto" style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                opacity: activeSection === s.key ? 0.8 : 0.45,
              }}>
                {s.count}
              </span>
            </button>
          ))}
        </div>
      </KostaCard>

      <KostaCard className="overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: palette.border }}>
          <Search size={13} style={{ opacity: 0.4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari tag atau nama ternak..."
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="cursor-pointer opacity-40 hover:opacity-70 text-xs">✕</button>
          )}
        </div>

        {/* Masuk table */}
        {activeSection === 'masuk' && (
          <>
            <TableHeader cols={['TAG', 'NAMA', 'KATEGORI', 'KELAMIN', 'BERAT AWAL', 'TGL DAFTAR', 'FARM']} grid="0.8fr 1fr 0.9fr 0.7fr 0.7fr 0.8fr 0.8fr" />
            {filteredMasuk.length === 0 ? <NoResults /> : masukP.paged.map((h: any, i: number) => (
              <TableRow key={h.id} i={i} grid="0.8fr 1fr 0.9fr 0.7fr 0.7fr 0.8fr 0.8fr" cells={[
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>{h.tag}</span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{h.nama || <span style={{ opacity: 0.4 }}>—</span>}</span>,
                <Badge variant={h.kategori === 'INDUKAN' ? 'moss' : h.kategori === 'PEJANTAN' ? 'ink' : 'ochre'}>{h.kategori.replace('_', ' ')}</Badge>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>{h.kelamin === 'JANTAN' ? '♂' : '♀'}</span>,
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14 }}>{h.berat ? `${h.berat} kg` : '—'}</span>,
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>{formatDate(h.createdAt)}</span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, opacity: 0.7 }}>{h.farm || '—'}</span>,
              ]} />
            ))}
          </>
        )}
        {activeSection === 'masuk' && filteredMasuk.length > 0 && (
          <div className="px-5 pb-4">
            <PaginationControl page={masukP.page} totalPages={masukP.totalPages} onPrev={masukP.onPrev} onNext={masukP.onNext} totalItems={filteredMasuk.length} perPage={20} />
          </div>
        )}
        {activeSection === 'keluar' && (
          <>
            <TableHeader cols={['TAG', 'NAMA', 'STATUS', 'BERAT', 'TGL DAFTAR', 'KETERANGAN', 'FARM']} grid="0.8fr 1fr 0.7fr 0.6fr 0.8fr 1fr 0.8fr" />
            {filteredKeluar.length === 0 ? <NoResults /> : keluarP.paged.map((h: any, i: number) => (
              <TableRow key={h.id} i={i} grid="0.8fr 1fr 0.7fr 0.6fr 0.8fr 1fr 0.8fr" cells={[
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>{h.tag}</span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{h.nama || '—'}</span>,
                <span className="flex items-center gap-1.5" style={{ color: h.status === 'MATI' ? palette.rose : palette.ochre }}>
                  {h.status === 'MATI' ? <Skull size={12} /> : <ShoppingCart size={12} />}
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>{h.status}</span>
                </span>,
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14 }}>{h.berat ? `${h.berat} kg` : '—'}</span>,
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>{formatDate(h.createdAt)}</span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, opacity: 0.6 }}>
                  {h.status === 'MATI' ? 'Ternak mati' : 'Terjual'}
                </span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, opacity: 0.7 }}>{h.farm || '—'}</span>,
              ]} />
            ))}
          </>
        )}
        {activeSection === 'keluar' && filteredKeluar.length > 0 && (
          <div className="px-5 pb-4">
            <PaginationControl page={keluarP.page} totalPages={keluarP.totalPages} onPrev={keluarP.onPrev} onNext={keluarP.onNext} totalItems={filteredKeluar.length} perPage={20} />
          </div>
        )}
        {activeSection === 'mutasi' && (
          <>
            <TableHeader cols={['TAG', 'NAMA', 'DARI FARM', 'KE FARM', 'TGL TRANSFER', 'ALASAN']} grid="0.7fr 0.9fr 1fr 1fr 0.8fr 1.4fr" />
            {filteredMutasi.length === 0 ? <NoResults /> : mutasiP.paged.map((t: any, i: number) => (
              <TableRow key={t.id} i={i} grid="0.7fr 0.9fr 1fr 1fr 0.8fr 1.4fr" cells={[
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>{t.tag}</span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{t.nama || '—'}</span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>{t.fromFarm?.replace('Farm ', '')}</span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>{t.toFarm?.replace('Farm ', '')}</span>,
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>{formatDate(t.tanggal)}</span>,
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, opacity: 0.7 }}>{t.alasan || '—'}</span>,
              ]} />
            ))}
          </>
        )}
        {activeSection === 'mutasi' && filteredMutasi.length > 0 && (
          <div className="px-5 pb-4">
            <PaginationControl page={mutasiP.page} totalPages={mutasiP.totalPages} onPrev={mutasiP.onPrev} onNext={mutasiP.onNext} totalItems={filteredMutasi.length} perPage={20} />
          </div>
        )}
      </KostaCard>
    </motion.div>
  )
}

// ─── LAPORAN 2: KESEHATAN & MEDIS ──────────────────────────
function LaporanMedis({ data }: { data: any[] }) {
  const [filterKategori, setFilterKategori] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const kategoris = ['ALL', 'VAKSINASI', 'VITAMIN', 'PENGOBATAN', 'PEMERIKSAAN', 'PERAWATAN_LUKA', 'LAINNYA']

  const filtered = useMemo(() => {
    return (data ?? []).filter((m: any) => {
      const matchKat = filterKategori === 'ALL' || m.kategori === filterKategori
      const q = search.toLowerCase()
      const matchSearch = !q || m.hewanTag?.toLowerCase().includes(q) ||
        m.hewanNama?.toLowerCase().includes(q) || m.diagnosis?.toLowerCase().includes(q) ||
        m.obat?.toLowerCase().includes(q) || m.namaDokter?.toLowerCase().includes(q)
      return matchKat && matchSearch
    })
  }, [data, filterKategori, search])

  const medisP = usePagination(filtered, 20)

  // Stats per kategori
  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((m: any) => {
      counts[m.kategori] = (counts[m.kategori] || 0) + 1
    })
    return counts
  }, [data])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Stats strip */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {['VAKSINASI', 'VITAMIN', 'PENGOBATAN', 'PEMERIKSAAN', 'PERAWATAN_LUKA', 'LAINNYA'].map(k => (
          <div
            key={k}
            className="p-4 cursor-pointer transition-all rounded-2xl"
            onClick={() => setFilterKategori(filterKategori === k ? 'ALL' : k)}
            style={{
              background: '#fff',
              border: filterKategori === k ? `2px solid ${KATEGORI_MEDIS_COLOR[k]}` : `1px solid ${palette.border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2" style={{ color: KATEGORI_MEDIS_COLOR[k] }}>
              {KATEGORI_MEDIS_ICON[k]}
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.1em', opacity: 0.8 }}>
                {KATEGORI_MEDIS_LABEL[k].toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, letterSpacing: '-0.02em', color: KATEGORI_MEDIS_COLOR[k] }}>
              {stats[k] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <KostaCard className="overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: palette.border }}>
          <Search size={13} style={{ opacity: 0.4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari tag, diagnosis, dokter..."
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
          />
          {filterKategori !== 'ALL' && (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer"
              onClick={() => setFilterKategori('ALL')}
              style={{ background: `${KATEGORI_MEDIS_COLOR[filterKategori]}15`, color: KATEGORI_MEDIS_COLOR[filterKategori] }}
            >
              {KATEGORI_MEDIS_LABEL[filterKategori]} ✕
            </span>
          )}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.4 }}>{filtered.length} rekaman</span>
        </div>

        <TableHeader
          cols={['TANGGAL', 'TAG', 'KATEGORI', 'DIAGNOSIS / TINDAKAN', 'OBAT / VAKSIN', 'DOKTER', 'STATUS', 'KONTROL']}
          grid="0.7fr 0.7fr 0.9fr 1.6fr 1fr 0.9fr 0.6fr 0.7fr"
        />
        {filtered.length === 0 ? <NoResults /> : medisP.paged.map((m: any, i: number) => (
          <TableRow key={m.id} i={i} grid="0.7fr 0.7fr 0.9fr 1.6fr 1fr 0.9fr 0.6fr 0.7fr" cells={[
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>{formatDate(m.tanggal)}</span>,
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>{m.hewanTag}</div>
              {m.hewanNama && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10.5, opacity: 0.5 }}>{m.hewanNama}</div>}
            </div>,
            <span
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
              style={{
                background: `${KATEGORI_MEDIS_COLOR[m.kategori]}15`,
                color: KATEGORI_MEDIS_COLOR[m.kategori],
                fontFamily: "'Inter',sans-serif", fontSize: 11,
              }}
            >
              {KATEGORI_MEDIS_ICON[m.kategori]}
              {KATEGORI_MEDIS_LABEL[m.kategori]}
            </span>,
            <div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{m.diagnosis}</div>
              {m.notes && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10.5, opacity: 0.5, marginTop: 2 }}>{m.notes}</div>}
            </div>,
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>{m.obat || <span style={{ opacity: 0.35 }}>—</span>}</span>,
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, opacity: 0.7 }}>{m.namaDokter || '—'}</span>,
            <Badge variant={m.status === 'SEMBUH' ? 'emerald' : m.status === 'RAWAT' ? 'rose' : 'amber'}>{m.status}</Badge>,
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.6 }}>
              {m.tanggalLanjut ? formatDate(m.tanggalLanjut) : '—'}
            </span>,
          ]} />
        ))}
      </KostaCard>
      {filtered.length > 0 && (
        <div className="px-5 pb-4">
          <PaginationControl page={medisP.page} totalPages={medisP.totalPages} onPrev={medisP.onPrev} onNext={medisP.onNext} totalItems={filtered.length} perPage={20} />
        </div>
      )}
    </motion.div>
  )
}

// ─── LAPORAN 3: BREEDING ────────────────────────────────────
function LaporanBreeding({ data }: { data: any[] }) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return (data ?? []).filter((r: any) => {
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus
      const q = search.toLowerCase()
      const matchSearch = !q || r.indukTag?.toLowerCase().includes(q) ||
        r.pejantanTag?.toLowerCase().includes(q) || r.indukNama?.toLowerCase().includes(q) ||
        r.pejantanNama?.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [data, filterStatus, search])

  const breedingP = usePagination(filtered, 15)

  const stats = useMemo(() => ({
    HAMIL: (data ?? []).filter((r: any) => r.status === 'HAMIL').length,
    LAHIR: (data ?? []).filter((r: any) => r.status === 'LAHIR').length,
    GAGAL: (data ?? []).filter((r: any) => r.status === 'GAGAL').length,
    inbreeding: (data ?? []).filter((r: any) => r.inbreedingWarning).length,
  }), [data])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { key: 'HAMIL', label: 'Sedang Hamil', color: palette.amber },
          { key: 'LAHIR', label: 'Berhasil Lahir', color: palette.moss },
          { key: 'GAGAL', label: 'Gagal / Keguguran', color: palette.rose },
          { key: 'inbreeding', label: 'Alert Inbreeding', color: '#8B5CF6' },
        ].map(s => (
          <div
            key={s.key}
            className="p-5 cursor-pointer transition-all rounded-2xl"
            onClick={() => setFilterStatus(s.key === 'inbreeding' ? 'ALL' : (filterStatus === s.key ? 'ALL' : s.key))}
            style={{
              background: '#fff',
              border: filterStatus === s.key ? `2px solid ${s.color}` : `1px solid ${palette.border}`,
            }}
          >
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, letterSpacing: '-0.025em', color: s.color }}>
              {stats[s.key as keyof typeof stats]}
            </div>
          </div>
        ))}
      </div>

      <KostaCard className="overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: palette.border }}>
          <Search size={13} style={{ opacity: 0.4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari tag induk atau pejantan..."
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
          />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.4 }}>{filtered.length} kartu</span>
        </div>

        {/* Breeding cards */}
        <div className="divide-y" style={{ borderColor: palette.border }}>
          {filtered.length === 0 ? <NoResults /> : breedingP.paged.map((r: any, i: number) => {
            const isExpanded = expandedId === r.id
            const daysToLahir = Math.ceil((new Date(r.estimasiLahir).getTime() - Date.now()) / 86400000)
            const isOverdue = daysToLahir < 0 && r.status === 'HAMIL'

            return (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                <div
                  className="px-5 py-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Status dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: r.status === 'HAMIL' ? palette.amber : r.status === 'LAHIR' ? palette.moss : palette.rose }}
                    />

                    {/* Induk + Pejantan */}
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5, marginBottom: 2 }}>INDUK</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{r.indukTag}</div>
                        {r.indukNama && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.55 }}>{r.indukNama}</div>}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5, marginBottom: 2 }}>PEJANTAN</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{r.pejantanTag}</div>
                        {r.pejantanNama && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.55 }}>{r.pejantanNama}</div>}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5, marginBottom: 2 }}>TGL KAWIN</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{formatDate(r.tanggalKawin)}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5, marginBottom: 2 }}>EST. LAHIR</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{formatDate(r.estimasiLahir)}</div>
                        {r.status === 'HAMIL' && (
                          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10.5, color: isOverdue ? palette.rose : palette.amber }}>
                            {isOverdue ? `Lewat ${Math.abs(daysToLahir)} hari` : `${daysToLahir} hari lagi`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={r.status === 'HAMIL' ? 'amber' : r.status === 'LAHIR' ? 'emerald' : 'rose'}>{r.status}</Badge>
                      {r.inbreedingWarning && <Badge variant="rose">INBREED</Badge>}
                      {isExpanded ? <ChevronUp size={14} style={{ opacity: 0.4 }} /> : <ChevronDown size={14} style={{ opacity: 0.4 }} />}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 grid grid-cols-2 lg:grid-cols-4 gap-4"
                        style={{ background: 'rgba(13,20,15,0.02)', borderTop: `1px solid ${palette.border}` }}
                      >
                        <DetailItem label="Berat Induk" value={r.indukBerat ? `${r.indukBerat} kg` : '—'} />
                        <DetailItem label="Berat Pejantan" value={r.pejantanBerat ? `${r.pejantanBerat} kg` : '—'} />
                        <DetailItem label="Farm" value={r.farm || '—'} />
                        <DetailItem label="Risiko Inbreeding" value={r.inbreedingWarning ? 'YA — Waspadai!' : 'Tidak'} />
                        {r.anak && (
                          <>
                            <DetailItem label="Tag Anak" value={r.anak.tag} />
                            <DetailItem label="Nama Anak" value={r.anak.nama || '—'} />
                            <DetailItem label="Kelamin Anak" value={r.anak.kelamin === 'JANTAN' ? '♂ Jantan' : '♀ Betina'} />
                            <DetailItem label="Berat Lahir" value={r.anak.berat ? `${r.anak.berat} kg` : '—'} />
                          </>
                        )}
                        {r.anakTag && !r.anak && (
                          <DetailItem label="Ref. Anak" value={r.anakTag} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </KostaCard>
      {filtered.length > 0 && (
        <PaginationControl page={breedingP.page} totalPages={breedingP.totalPages} onPrev={breedingP.onPrev} onNext={breedingP.onNext} totalItems={filtered.length} perPage={15} />
      )}
    </motion.div>
  )
}

// ─── LAPORAN 4: PERTUMBUHAN BOBOT ──────────────────────────
function LaporanPertumbuhan({ data }: { data: any[] }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'adg' | 'selisih' | 'beratAkhir'>('adg')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const q = search.toLowerCase()
    return (data ?? [])
      .filter((d: any) =>
        !q || d.hewan?.tag?.toLowerCase().includes(q) || d.hewan?.nama?.toLowerCase().includes(q)
      )
      .sort((a: any, b: any) => {
        const diff = a[sortBy] - b[sortBy]
        return sortDir === 'desc' ? -diff : diff
      })
  }, [data, search, sortBy, sortDir])

  const pertumbuhanP = usePagination(sorted, 15)

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('desc') }
  }

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />
    return sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />
  }

  // Summary stats
  const avgAdg = data?.length ? Math.round(data.reduce((a: number, d: any) => a + d.adg, 0) / data.length * 1000) / 1000 : 0
  const avgBerat = data?.length ? Math.round(data.reduce((a: number, d: any) => a + d.beratAkhir, 0) / data.length * 10) / 10 : 0

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Ternak Dipantau', value: String(data?.length ?? 0), sub: 'dengan data penimbangan', color: palette.moss },
          { label: 'Rata-rata Berat Saat Ini', value: `${avgBerat} kg`, sub: 'berat terakhir tercatat', color: palette.ochre },
          { label: 'Rata-rata ADG', value: `${avgAdg} kg/hr`, sub: 'Average Daily Gain', color: palette.ink },
          { label: 'Total Pengukuran', value: String(data?.reduce((a: number, d: any) => a + d.totalPengukuran, 0) ?? 0), sub: 'rekaman berat badan', color: '#5B7FA6' },
        ].map(s => (
          <KostaCard key={s.label} className="p-5">
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, letterSpacing: '-0.025em', color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.45, marginTop: 4 }}>{s.sub}</div>
          </KostaCard>
        ))}
      </div>

      <KostaCard className="overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: palette.border }}>
          <Search size={13} style={{ opacity: 0.4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari tag atau nama ternak..."
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
          />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.4 }}>{sorted.length} ternak</span>
        </div>

        {/* Header dengan sort */}
        <div className="px-5 py-3" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr 0.6fr',
          gap: 12,
          background: 'rgba(13,20,15,0.03)',
          borderBottom: `1px solid ${palette.border}`,
        }}>
          {[
            { label: 'TERNAK', key: null },
            { label: 'BERAT AWAL', key: null },
            { label: 'BERAT AKHIR', key: 'beratAkhir' as const },
            { label: 'SELISIH', key: 'selisih' as const },
            { label: 'ADG (KG/HR)', key: 'adg' as const },
            { label: 'GRAFIK BERAT', key: null },
            { label: 'REKAM', key: null },
          ].map((col, i) => (
            <div
              key={i}
              className={col.key ? 'cursor-pointer flex items-center gap-1 select-none' : 'flex items-center'}
              onClick={() => col.key && toggleSort(col.key)}
              style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                letterSpacing: '0.12em', color: 'rgba(13,20,15,0.55)',
              }}
            >
              {col.label}
              {col.key && <SortIcon field={col.key} />}
            </div>
          ))}
        </div>

        <div className="divide-y" style={{ borderColor: palette.border }}>
          {sorted.length === 0 ? <NoResults /> : pertumbuhanP.paged.map((d: any, i: number) => {
            const isExpanded = expandedId === d.hewan?.tag
            const trendUp = d.selisih > 0
            const trendFlat = d.selisih === 0

            return (
              <motion.div key={d.hewan?.tag} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}>
                <div
                  className="px-5 py-3 cursor-pointer hover:bg-black/[0.02] transition-colors"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr 0.6fr', gap: 12, alignItems: 'center' }}
                  onClick={() => setExpandedId(isExpanded ? null : d.hewan?.tag)}
                >
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{d.hewan?.tag}</div>
                    {d.hewan?.nama && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.5 }}>{d.hewan.nama}</div>}
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10.5, opacity: 0.4 }}>{d.hewan?.kategori?.replace('_', ' ')}</div>
                  </div>
                  <span style={{ fontFamily: "'Fraunces',serif", fontSize: 15 }}>{d.beratAwal} kg</span>
                  <span style={{ fontFamily: "'Fraunces',serif", fontSize: 15 }}>{d.beratAkhir} kg</span>
                  <span className="flex items-center gap-1" style={{
                    fontFamily: "'Fraunces',serif", fontSize: 15,
                    color: trendFlat ? palette.ink : trendUp ? palette.moss : palette.rose,
                  }}>
                    {trendFlat ? <Minus size={11} /> : trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {trendUp ? '+' : ''}{d.selisih} kg
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                    color: d.adg > 0.05 ? palette.moss : d.adg < 0 ? palette.rose : palette.ink,
                  }}>
                    {d.adg > 0 ? '+' : ''}{d.adg}
                  </span>
                  {/* Mini sparkline */}
                  <div style={{ height: 32 }}>
                    {d.records.length > 1 ? (
                      <ResponsiveContainer width="100%" height={32}>
                        <LineChart data={d.records} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
                          <Line
                            type="monotone" dataKey="berat" dot={false}
                            stroke={trendUp ? palette.moss : trendFlat ? palette.ink : palette.rose}
                            strokeWidth={1.5}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10.5, opacity: 0.35 }}>1 data</span>
                    )}
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, opacity: 0.6, textAlign: 'center' }}>
                    {d.totalPengukuran}×
                  </span>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 py-4" style={{ background: 'rgba(13,20,15,0.02)', borderTop: `1px solid ${palette.border}` }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.14em', opacity: 0.5, marginBottom: 12 }}>
                          RIWAYAT PENIMBANGAN
                        </div>
                        <div className="grid gap-1.5">
                          {d.records.map((rec: any, ri: number) => (
                            <div key={ri} className="flex items-center gap-4">
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, opacity: 0.6, minWidth: 80 }}>
                                {formatDate(rec.tanggal)}
                              </span>
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min((rec.berat / (d.beratAkhir * 1.2)) * 100, 100)}%`,
                                  background: palette.moss, opacity: 0.6,
                                  minWidth: 4,
                                }}
                              />
                              <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14 }}>{rec.berat} kg</span>
                              {rec.catatan && (
                                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.5 }}>{rec.catatan}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </KostaCard>
      {sorted.length > 0 && (
        <PaginationControl page={pertumbuhanP.page} totalPages={pertumbuhanP.totalPages} onPrev={pertumbuhanP.onPrev} onNext={pertumbuhanP.onNext} totalItems={sorted.length} perPage={15} />
      )}
    </motion.div>
  )
}

// ─── SHARED HELPERS ─────────────────────────────────────────
function TableHeader({ cols, grid }: { cols: string[]; grid: string }) {
  return (
    <div className="px-5 py-3" style={{
      display: 'grid', gridTemplateColumns: grid, gap: 12,
      background: 'rgba(13,20,15,0.03)', borderBottom: `1px solid ${palette.border}`,
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
      letterSpacing: '0.12em', color: 'rgba(13,20,15,0.55)',
    }}>
      {cols.map(c => <div key={c}>{c}</div>)}
    </div>
  )
}

function TableRow({ cells, grid, i }: { cells: React.ReactNode[]; grid: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(i * 0.015, 0.3) }}
      className="px-5 py-3"
      style={{
        display: 'grid', gridTemplateColumns: grid, gap: 12,
        alignItems: 'center', borderBottom: `1px solid ${palette.border}`,
      }}
    >
      {cells.map((c, k) => <div key={k}>{c}</div>)}
    </motion.div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.12em', opacity: 0.5, marginBottom: 3 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>{value}</div>
    </div>
  )
}

function NoResults() {
  return (
    <div className="py-14 text-center" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, opacity: 0.4, fontStyle: 'italic' }}>
      Tidak ada data yang cocok
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
