'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Plus, Syringe, Baby, Scale, Bell, Check } from 'lucide-react'
import { tandaiSudahDibaca } from '@/actions/notifikasi'
import { KostaPageHeader, KostaButton, Badge, palette } from '@/components/KostaUI'

type Notifikasi = {
  id: string
  title: string
  message: string
  tanggal: Date | string
  isRead: boolean
  type: string
}

const ICONS: Record<string, React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  VAKSIN: Syringe,
  LAHIR: Baby,
  BERAT: Scale,
  CUSTOM: Bell,
}

const TONES: Record<string, { bg: string; fg: string }> = {
  VAKSIN: { bg: 'rgba(199,135,62,0.14)', fg: palette.ochre },
  LAHIR: { bg: 'rgba(63,91,58,0.14)', fg: palette.moss },
  BERAT: { bg: 'rgba(63,122,78,0.14)', fg: palette.emerald },
  CUSTOM: { bg: 'rgba(13,20,15,0.08)', fg: palette.ink },
}

const BADGE_VARIANT: Record<string, 'ochre' | 'moss' | 'emerald' | 'default'> = {
  VAKSIN: 'ochre',
  LAHIR: 'moss',
  BERAT: 'emerald',
  CUSTOM: 'default',
}

export function ClientNotifList({ notifikasi: seed }: { notifikasi: Notifikasi[] }) {
  const [list, setList] = useState(seed)
  const [filter, setFilter] = useState<string>('ALL')
  const [isPending, startTransition] = useTransition()

  const filtered = list.filter((n) => filter === 'ALL' || n.type === filter)
  const unread = list.filter((n) => !n.isRead).length

  return (
    <div>
      <KostaPageHeader
        title="Pengingat Operasional"
        description={`${unread} notifikasi belum dibaca. Jadwal vaksin, kelahiran, dan penimbangan rutin.`}
        action={
          <KostaButton>
            <Plus size={13} /> Buat Reminder
          </KostaButton>
        }
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['ALL', 'VAKSIN', 'LAHIR', 'BERAT', 'CUSTOM'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="cursor-pointer relative px-4 py-2 rounded-full"
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10.5,
              letterSpacing: '0.1em',
              border: `1px solid ${palette.border}`,
            }}
          >
            {filter === f && (
              <motion.div
                layoutId="notif-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: palette.ink }}
              />
            )}
            <span className="relative" style={{ color: filter === f ? palette.cream : palette.ink }}>
              {f === 'ALL'
                ? `SEMUA · ${list.length}`
                : `${f} · ${list.filter((n) => n.type === f).length}`}
            </span>
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div
            className="py-16 text-center"
            style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontStyle: 'italic', color: palette.moss }}
          >
            Tidak ada notifikasi.
          </div>
        )}
        {filtered.map((n, i) => {
          const Icon = ICONS[n.type] ?? Bell
          const t = TONES[n.type] ?? TONES.CUSTOM
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-4 flex items-center gap-4 transition-all duration-300"
              style={{
                background: n.isRead ? 'rgba(255, 255, 255, 0.45)' : '#fff',
                border: `1px solid ${n.isRead ? palette.border : 'rgba(13,20,15,0.12)'}`,
                boxShadow: n.isRead ? 'none' : '0 6px 20px rgba(13,20,15,0.05)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: t.bg, color: t.fg }}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={BADGE_VARIANT[n.type] ?? 'default'}>{n.type}</Badge>
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
                  )}
                </div>
                <div className="mt-1.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                  {n.title}
                </div>
                <div className="mt-0.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, opacity: 0.7 }}>
                  {n.message}
                </div>
                <div
                  className="opacity-55 mt-0.5"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}
                >
                  {new Date(n.tanggal).toLocaleDateString('id-ID')}
                </div>
              </div>
              <button
                onClick={() =>
                  startTransition(() => {
                    tandaiSudahDibaca(n.id)
                    setList((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: !x.isRead } : x)))
                  })
                }
                disabled={isPending}
                className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  border: `1px solid ${palette.border}`,
                  color: n.isRead ? 'rgba(13,20,15,0.4)' : palette.emerald,
                }}
              >
                <Check size={14} />
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
