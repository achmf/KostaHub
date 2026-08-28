'use client'

import { motion } from 'framer-motion'
import { Building2, CheckCircle2, Clock } from 'lucide-react'
import { KostaCard, KostaSectionLabel, palette } from '@/components/KostaUI'

type FarmStatus = 'AKTIF' | 'NONAKTIF' | 'DELETED'

interface Farm {
  id: string
  nama: string
  status: FarmStatus
}

interface UserFarm {
  farm: Farm
  assignedAt: Date | string
}

interface FarmMembershipsProps {
  farms: UserFarm[]
}

const STATUS_CONFIG: Record<FarmStatus, { label: string; color: string; bg: string; Icon: React.FC<{ size?: number; style?: React.CSSProperties }> }> = {
  AKTIF: {
    label: 'Aktif',
    color: '#3F7A4E',
    bg: 'rgba(63,122,78,0.10)',
    Icon: CheckCircle2,
  },
  NONAKTIF: {
    label: 'Menunggu Persetujuan',
    color: '#7A5118',
    bg: 'rgba(199,135,62,0.12)',
    Icon: Clock,
  },
  DELETED: {
    label: 'Dihapus',
    color: '#B5443B',
    bg: 'rgba(181,68,59,0.10)',
    Icon: Clock,
  },
}

export function FarmMemberships({ farms }: FarmMembershipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      <KostaCard>
        <div className="px-6 py-5 border-b" style={{ borderColor: palette.border }}>
          <div className="flex items-center gap-2">
            <Building2 size={15} style={{ color: palette.moss }} />
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 17, color: palette.ink }}>
              Farm Terhubung
            </div>
          </div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.55)', marginTop: 4 }}>
            Daftar farm yang terhubung dengan akun Anda.
          </div>
        </div>

        <div className="px-6 py-4">
          {farms.length === 0 ? (
            <div
              className="text-center py-8"
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: 16,
                fontStyle: 'italic',
                color: 'rgba(13,20,15,0.35)',
              }}
            >
              Belum ada farm yang terhubung.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {farms.map(({ farm, assignedAt }) => {
                const cfg = STATUS_CONFIG[farm.status] ?? STATUS_CONFIG.NONAKTIF
                const StatusIcon = cfg.Icon
                const assignedDate = new Date(assignedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })

                return (
                  <div
                    key={farm.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: 'rgba(13,20,15,0.025)',
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(27,42,31,0.08)' }}
                    >
                      <Building2 size={15} style={{ color: palette.forest, opacity: 0.7 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate"
                        style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink }}
                      >
                        {farm.nama}
                      </div>
                      <KostaSectionLabel className="mt-0.5">
                        Bergabung {assignedDate}
                      </KostaSectionLabel>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <StatusIcon size={11} style={{ color: cfg.color }} />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 10,
                          letterSpacing: '0.06em',
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </KostaCard>
    </motion.div>
  )
}
