'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Search, Layers, Activity, AlertCircle,
  PanelLeftClose, PanelLeftOpen, Flame, CircleDot, PenLine, X,
  Users, Building2, CheckCircle2,
} from 'lucide-react'
import PaginationControl from './PaginationControl'
import { usePagination } from '@/hooks/usePagination'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  ochre: '#C7873E',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  muted: 'rgba(13,20,15,0.50)',
}

const AdminFarmMap = dynamic(() => import('@/components/Admin/AdminFarmMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full" style={{ background: 'rgba(13,20,15,0.04)' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: `${palette.moss} transparent ${palette.moss} ${palette.moss}` }} />
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.muted }}>Memuat peta GIS…</p>
      </div>
    </div>
  ),
})

export interface AdminFarm {
  id: string
  nama: string
  alamat: string | null
  lat: number | null
  lng: number | null
  geojson: string | null
  deskripsi: string | null
  status: string
  ownerName: string
  _count: { hewan: number }
  hewanAktif: number
  hewanMati: number
  hewanIndukan: number
  hewanPejantan: number
}

export type MapLayer = 'street' | 'satellite' | 'terrain'

function StatPill({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-3 rounded-xl"
      style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: color || palette.ink }}>{value}</span>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: palette.muted, marginTop: 2 }}>{label}</span>
    </div>
  )
}

function FarmCard({ farm, selected, onSelect }: { farm: AdminFarm; selected: boolean; onSelect: () => void }) {
  const isActive = farm.status === 'AKTIF'
  return (
    <motion.button
      layout
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer w-full text-left rounded-xl p-3.5 transition-all"
      style={{
        background: selected ? palette.forest : '#fff',
        border: `1px solid ${selected ? palette.forest : palette.border}`,
        color: selected ? palette.cream : palette.ink,
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ background: isActive ? '#4ade80' : 'rgba(13,20,15,0.25)' }} />
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13 }} className="truncate">
            {farm.nama}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Users size={9} style={{ opacity: 0.5 }} />
            <span className="truncate" style={{ fontSize: 11, fontFamily: "'Inter',sans-serif", opacity: 0.6 }}>
              {farm.ownerName}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, opacity: selected ? 0.7 : 0.5 }}>
              <Activity size={8} className="inline mr-0.5" />{farm._count.hewan} hewan
            </span>
            {farm.lat ? (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, opacity: selected ? 0.7 : 0.5 }}>
                <MapPin size={8} className="inline mr-0.5" />GPS
              </span>
            ) : (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#C7873E' }}>No GPS</span>
            )}
            {farm.geojson && (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: selected ? 'rgba(242,237,224,0.7)' : palette.moss }}>
                ◆ Area
              </span>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 grid grid-cols-2 gap-1.5"
            style={{ borderTop: '1px solid rgba(242,237,224,0.15)' }}
          >
            {[
              { label: 'AKTIF', val: farm.hewanAktif },
              { label: 'INDUKAN', val: farm.hewanIndukan },
              { label: 'PEJANTAN', val: farm.hewanPejantan },
              { label: 'MATI', val: farm.hewanMati },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-lg py-1.5" style={{ background: 'rgba(242,237,224,0.08)' }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16 }}>{s.val}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.15em', opacity: 0.55 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function RadiusPanel({
  radiusKm,
  onRadiusChange,
  farmsInRadius,
  onSelectFarm,
}: {
  radiusKm: number
  onRadiusChange: (km: number) => void
  farmsInRadius: AdminFarm[]
  onSelectFarm: (farm: AdminFarm) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mx-3 mb-3 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(199,135,62,0.3)', background: 'rgba(199,135,62,0.06)' }}
    >
      <div className="px-4 pt-3 pb-2">
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: palette.ochre, marginBottom: 8 }}>
          RADIUS ANALYSIS
        </div>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.ink }}>
            Radius: <strong>{radiusKm} km</strong>
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: palette.ochre }}>
            {farmsInRadius.length} farm
          </span>
        </div>
        <input
          type="range" min={5} max={300} step={5} value={radiusKm}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full" style={{ accentColor: palette.ochre }}
        />
        <div className="flex justify-between mt-1">
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: palette.muted }}>5 km</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: palette.muted }}>300 km</span>
        </div>
      </div>
      {farmsInRadius.length > 0 && (
        <div className="px-3 pb-3 space-y-1.5 max-h-40 overflow-y-auto">
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.15em', color: palette.muted, padding: '2px 4px' }}>
            FARM DALAM RADIUS
          </div>
          {farmsInRadius.map((f) => (
            <button key={f.id} onClick={() => onSelectFarm(f)}
              className="cursor-pointer w-full text-left px-3 py-2 rounded-lg transition-all hover:bg-white"
              style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${palette.border}` }}>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: palette.ink }}>{f.nama}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: palette.muted }}>
                {f.ownerName} · {f._count.hewan} hewan
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminMapClient({
  farms: initialFarms,
  owners,
}: {
  farms: AdminFarm[]
  owners: string[]
}) {
  const [farms, setFarms] = useState<AdminFarm[]>(initialFarms)
  const [selectedFarm, setSelectedFarm] = useState<AdminFarm | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AKTIF' | 'NONAKTIF'>('ALL')
  const [filterOwner, setFilterOwner] = useState<string>('ALL')
  const [layer, setLayer] = useState<MapLayer>('street')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showRadius, setShowRadius] = useState(false)
  const [drawMode, setDrawMode] = useState(false)
  const [radiusKm, setRadiusKm] = useState(50)
  const [radiusCenter, setRadiusCenter] = useState({ lat: -6.9175, lng: 107.6191 })
  const [farmsInRadius, setFarmsInRadius] = useState<AdminFarm[]>([])

  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const matchSearch = f.nama.toLowerCase().includes(search.toLowerCase())
        || (f.alamat?.toLowerCase().includes(search.toLowerCase()) ?? false)
        || f.ownerName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'ALL' || f.status === filterStatus
      const matchOwner = filterOwner === 'ALL' || f.ownerName === filterOwner
      return matchSearch && matchStatus && matchOwner
    })
  }, [farms, search, filterStatus, filterOwner])

  const PER_PAGE = 20
  const { paged: currentFarms, page, totalPages, onPrev, onNext } = usePagination(filteredFarms, PER_PAGE)

  const totalHewan = farms.reduce((a, f) => a + f._count.hewan, 0)
  const farmAktif = farms.filter((f) => f.status === 'AKTIF').length
  const farmGPS = farms.filter((f) => f.lat && f.lng).length
  const farmNoGPS = farms.filter((f) => !f.lat || !f.lng).length

  const handleDrawSaved = useCallback((farmId: string, geojson: string | null) => {
    setFarms((prev) => prev.map((f) => f.id === farmId ? { ...f, geojson } : f))
    setSelectedFarm((prev) => prev?.id === farmId ? { ...prev, geojson } : prev)
  }, [])

  const handleFarmsInRadius = useCallback((inRadius: AdminFarm[]) => {
    setFarmsInRadius(inRadius)
  }, [])

  function toggleRadius() {
    if (!showRadius && selectedFarm?.lat && selectedFarm?.lng) {
      setRadiusCenter({ lat: selectedFarm.lat, lng: selectedFarm.lng })
    }
    setShowRadius((p) => !p)
  }

  function startDraw() {
    if (!selectedFarm) return
    setDrawMode(true)
    setSidebarOpen(false)
  }

  const toolbarButtons = [
    { key: 'heatmap', icon: <Flame size={13} />, label: 'Heatmap', active: showHeatmap, onClick: () => setShowHeatmap((p) => !p), color: '#C7873E' },
    { key: 'radius', icon: <CircleDot size={13} />, label: 'Radius', active: showRadius, onClick: toggleRadius, color: '#3F5B3A' },
    {
      key: 'draw',
      icon: <PenLine size={13} />,
      label: selectedFarm ? 'Gambar Kandang' : 'Pilih Farm',
      active: drawMode,
      onClick: selectedFarm ? startDraw : undefined,
      disabled: !selectedFarm,
      color: '#1B2A1F',
    },
  ]

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 73px)', overflow: 'hidden' }}>
      {/* Header */}
      <div className="mb-5">
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.2em', color: palette.muted, marginBottom: 6 }}>
          ADMIN · PETA GIS
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em', color: palette.ink }}>
              Peta GIS Semua Farm
            </h1>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.muted, marginTop: 4 }}>
              Visualisasi dan analisis geografis seluruh farm yang terdaftar di KostaHub.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {toolbarButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={btn.onClick}
                disabled={btn.disabled}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
                style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 12,
                  background: btn.active ? btn.color : '#fff',
                  color: btn.active ? '#F2EDE0' : btn.disabled ? palette.muted : palette.ink,
                  border: `1px solid ${btn.active ? btn.color : palette.border}`,
                  opacity: btn.disabled ? 0.5 : 1,
                  cursor: btn.disabled ? 'not-allowed' : 'pointer',
                }}
                title={btn.disabled ? 'Pilih farm terlebih dahulu' : undefined}
              >
                {btn.icon}
                {btn.label}
                {btn.active && <X size={11} style={{ opacity: 0.7 }} />}
              </button>
            ))}

            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
              {(['street', 'satellite', 'terrain'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayer(l)}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 12,
                    background: layer === l ? palette.forest : 'transparent',
                    color: layer === l ? palette.cream : palette.muted,
                  }}
                >
                  <Layers size={12} />
                  {l === 'street' ? 'Street' : l === 'satellite' ? 'Satelit' : 'Terrain'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatPill label="TOTAL FARM" value={farms.length} />
        <StatPill label="FARM AKTIF" value={farmAktif} color={palette.moss} />
        <StatPill label="TOTAL TERNAK" value={totalHewan} color={palette.ochre} />
        <StatPill label="TERPETAKAN" value={`${farmGPS}/${farms.length}`} color={farmNoGPS > 0 ? '#B5443B' : palette.moss} />
      </div>

      {/* Map + sidebar */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 290, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="shrink-0 flex flex-col rounded-2xl overflow-hidden min-h-0"
              style={{ background: '#fff', border: `1px solid ${palette.border}` }}
            >
              {/* Filters */}
              <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${palette.border}` }}>
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(13,20,15,0.04)', border: `1px solid ${palette.border}` }}>
                  <Search size={13} style={{ color: palette.muted }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama farm, owner…"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ fontFamily: "'Inter',sans-serif", color: palette.ink }}
                  />
                </div>

                {/* Status filter */}
                <div className="flex gap-1.5">
                  {(['ALL', 'AKTIF', 'NONAKTIF'] as const).map((s) => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className="cursor-pointer flex-1 py-1.5 rounded-lg transition-all"
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        background: filterStatus === s ? palette.forest : 'rgba(13,20,15,0.05)',
                        color: filterStatus === s ? palette.cream : palette.muted,
                        border: `1px solid ${filterStatus === s ? palette.forest : 'transparent'}`,
                      }}>
                      {s === 'ALL' ? 'SEMUA' : s}
                    </button>
                  ))}
                </div>

                {/* Owner filter */}
                {owners.length > 0 && (
                  <select
                    value={filterOwner}
                    onChange={(e) => setFilterOwner(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12,
                      color: palette.ink,
                      background: 'rgba(13,20,15,0.04)',
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <option value="ALL">Semua Owner</option>
                    {owners.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Farm list */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {filteredFarms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 size={24} style={{ color: palette.muted, marginBottom: 8 }} />
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.muted }}>Tidak ada farm ditemukan</p>
                  </div>
                ) : (
                  <>
                    {currentFarms.map((farm) => (
                      <FarmCard
                        key={farm.id}
                        farm={farm}
                        selected={selectedFarm?.id === farm.id}
                        onSelect={() => setSelectedFarm((prev) => prev?.id === farm.id ? null : farm)}
                      />
                    ))}
                    {filteredFarms.length > 0 && (
                      <div className="mt-2 mb-1 px-1">
                        <PaginationControl
                          page={page}
                          totalPages={totalPages}
                          onPrev={onPrev}
                          onNext={onNext}
                          totalItems={filteredFarms.length}
                          perPage={PER_PAGE}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Radius panel */}
              <AnimatePresence>
                {showRadius && (
                  <RadiusPanel
                    radiusKm={radiusKm}
                    onRadiusChange={setRadiusKm}
                    farmsInRadius={farmsInRadius}
                    onSelectFarm={setSelectedFarm}
                  />
                )}
              </AnimatePresence>

              {/* No-GPS warning */}
              {farmNoGPS > 0 && (
                <div className="mx-3 mb-3 flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(199,135,62,0.10)', border: '1px solid rgba(199,135,62,0.25)' }}>
                  <AlertCircle size={13} style={{ color: palette.ochre, marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.ochre, lineHeight: 1.5 }}>
                    {farmNoGPS} farm belum memiliki koordinat GPS.
                  </p>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Map */}
        <div className="flex-1 relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${palette.border}` }}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="cursor-pointer absolute top-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-sm transition-all hover:shadow-md"
            style={{
              background: '#fff',
              border: `1px solid ${palette.border}`,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              color: palette.ink,
            }}
          >
            {sidebarOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
            {sidebarOpen ? 'TUTUP' : 'PANEL'}
          </button>

          {/* Active badges */}
          {(showHeatmap || showRadius || drawMode) && (
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5">
              {showHeatmap && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: palette.ochre, color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.1em' }}>
                  <Flame size={10} /> HEATMAP
                </div>
              )}
              {showRadius && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: palette.moss, color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.1em' }}>
                  <CircleDot size={10} /> RADIUS {radiusKm}KM
                </div>
              )}
              {drawMode && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: palette.forest, color: palette.cream, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.1em' }}>
                  <PenLine size={10} /> DRAW MODE
                </div>
              )}
            </div>
          )}

          <AdminFarmMap
            farms={filteredFarms}
            selectedFarm={selectedFarm}
            onSelectFarm={setSelectedFarm}
            layer={layer}
            showHeatmap={showHeatmap}
            showRadius={showRadius}
            drawMode={drawMode}
            onDrawClose={() => { setDrawMode(false); setSidebarOpen(true) }}
            onDrawSaved={handleDrawSaved}
            radiusKm={radiusKm}
            radiusCenter={radiusCenter}
            onRadiusCenterChange={(lat, lng) => setRadiusCenter({ lat, lng })}
            onFarmsInRadius={handleFarmsInRadius}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 flex-wrap">
        {[
          { color: '#4ade80', label: 'Farm Aktif' },
          { color: 'rgba(13,20,15,0.3)', label: 'Farm Nonaktif' },
          { color: palette.ochre, label: 'Tidak ada GPS' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.muted }}>{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} style={{ color: palette.moss }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.muted }}>Polygon area kandang</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={12} style={{ color: palette.muted }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.muted }}>Inisial = nama owner</span>
        </div>
      </div>
    </div>
  )
}
