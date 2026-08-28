'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Heart,
  Building2,
  Users,
  Baby,
  Filter,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import PaginationControl from './PaginationControl'
import { usePagination } from '@/hooks/usePagination'

const palette = {
  ink: '#0D140F',
  ochre: '#C7873E',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  danger: '#B5443B',
  info: '#2C5F8A',
  border: 'rgba(13,20,15,0.09)',
  muted: 'rgba(13,20,15,0.45)',
}

type ActivityType = 'hewan' | 'medis' | 'farm' | 'user' | 'reproduksi'

interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  subtitle: string
  farmId?: string
  farmNama?: string
  timestamp: string
}

const TYPE_CONFIG: Record<ActivityType, { label: string; color: string; bg: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }> }> = {
  hewan: { label: 'Hewan', color: palette.ochre, bg: 'rgba(199,135,62,0.12)', icon: Activity },
  medis: { label: 'Rekam Medis', color: palette.danger, bg: 'rgba(181,68,59,0.12)', icon: Heart },
  farm: { label: 'Farm', color: palette.moss, bg: 'rgba(63,91,58,0.12)', icon: Building2 },
  user: { label: 'User', color: palette.info, bg: 'rgba(44,95,138,0.12)', icon: Users },
  reproduksi: { label: 'Reproduksi', color: '#7A5C2E', bg: 'rgba(122,92,46,0.12)', icon: Baby },
}

const ALL_TYPES: ActivityType[] = ['hewan', 'medis', 'farm', 'user', 'reproduksi']

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Baru saja'
  if (hrs < 1) return `${mins} menit lalu`
  if (days < 1) return `${hrs} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminActivityClient({ activities }: { activities: ActivityItem[] }) {
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all')

  const filtered = activeFilter === 'all'
    ? activities
    : activities.filter((a) => a.type === activeFilter)

  const PER_PAGE = 20
  const { paged, page, totalPages, onPrev, onNext } = usePagination(filtered, PER_PAGE)

  const counts = ALL_TYPES.reduce((acc, t) => {
    acc[t] = activities.filter((a) => a.type === t).length
    return acc
  }, {} as Record<ActivityType, number>)

  return (
    <div>
      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: palette.muted, marginBottom: 6 }}>
          BACKOFFICE
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em' }}>
          Activity <span style={{ fontStyle: 'italic', color: palette.ochre }}>Log</span>
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.6)', marginTop: 4 }}>
          Riwayat aktivitas sistem terbaru dari seluruh wilayah. {activities.length} entri terakhir.
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('all')}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 12.5,
            background: activeFilter === 'all' ? palette.forest : '#fff',
            color: activeFilter === 'all' ? '#fff' : palette.ink,
            border: `1px solid ${activeFilter === 'all' ? palette.forest : palette.border}`,
          }}
        >
          <Filter size={12} />
          Semua ({activities.length})
        </button>
        {ALL_TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t]
          const Icon = cfg.icon
          const isActive = activeFilter === t
          return (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: 12.5,
                background: isActive ? cfg.bg : '#fff',
                color: isActive ? cfg.color : palette.ink,
                border: `1px solid ${isActive ? cfg.color : palette.border}`,
              }}
            >
              <Icon size={12} style={{ color: isActive ? cfg.color : 'rgba(13,20,15,0.4)' }} />
              {cfg.label} ({counts[t]})
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[23px] top-0 bottom-0 w-px"
          style={{ background: 'rgba(13,20,15,0.07)' }}
        />

        <div className="space-y-1">
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: '#fff', border: `1px solid ${palette.border}` }}
            >
              <Clock size={24} style={{ color: palette.muted, margin: '0 auto 8px' }} />
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.muted }}>
                Belum ada aktivitas {activeFilter !== 'all' ? TYPE_CONFIG[activeFilter as ActivityType].label.toLowerCase() : ''}
              </p>
            </div>
          ) : (
            paged.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type]
              const Icon = cfg.icon
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.5) }}
                  className="flex items-start gap-4 py-2.5"
                >
                  {/* Icon dot on timeline */}
                  <div
                    className="w-[46px] h-[46px] rounded-xl flex items-center justify-center shrink-0 relative z-10"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>

                  {/* Card */}
                  <div
                    className="flex-1 rounded-xl px-4 py-3 group hover:shadow-sm transition-shadow"
                    style={{ background: '#fff', border: `1px solid ${palette.border}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, color: palette.ink }}>
                          {item.title}
                        </div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.muted, marginTop: 2 }}>
                          {item.subtitle}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.1em' }}
                        >
                          {cfg.label.toUpperCase()}
                        </span>
                        {item.farmId && (
                          <Link href={`/admin/farms/${item.farmId}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight size={13} style={{ color: palette.ochre }} />
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.35)', letterSpacing: '0.05em' }}>
                      <Clock size={9} />
                      {timeAgo(item.timestamp)}
                      {item.farmNama && (
                        <span style={{ color: 'rgba(13,20,15,0.25)' }}> · {item.farmNama}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <PaginationControl
          page={page}
          totalPages={totalPages}
          onPrev={onPrev}
          onNext={onNext}
          totalItems={filtered.length}
          perPage={PER_PAGE}
        />
      )}
    </div>
  )
}
