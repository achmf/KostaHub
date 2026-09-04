'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Mail, Phone, User } from 'lucide-react'
import { Badge, KostaCard, KostaSectionLabel, palette } from '@/components/KostaUI'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  DINAS: 'Dinas',
  OWNER: 'Owner',
  PETUGAS: 'Petugas',
}

const ROLE_VARIANT: Record<string, 'emerald' | 'amber' | 'ochre' | 'moss' | 'rose'> = {
  SUPER_ADMIN: 'rose',
  DINAS: 'amber',
  OWNER: 'emerald',
  PETUGAS: 'moss',
}

interface ProfileInfoCardProps {
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: Date | string
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${palette.border}` }}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(13,20,15,0.05)' }}
      >
        <Icon size={14} style={{ color: palette.moss, opacity: 0.8 }} />
      </div>
      <div className="flex-1 min-w-0">
        <KostaSectionLabel className="mb-0.5">{label}</KostaSectionLabel>
        <div
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 14,
            color: value ? palette.ink : 'rgba(13,20,15,0.35)',
            fontStyle: value ? 'normal' : 'italic',
          }}
        >
          {value || 'Belum diisi'}
        </div>
      </div>
    </div>
  )
}

export function ProfileInfoCard({ name, email, phone, role, createdAt }: ProfileInfoCardProps) {
  const joinDate = new Date(createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <KostaCard>
        {/* Avatar header */}
        <div
          className="px-6 py-6 flex flex-col items-center text-center gap-3"
          style={{ borderBottom: `1px solid ${palette.border}` }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: palette.forest,
              color: palette.cream,
              fontFamily: "'Fraunces',serif",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              boxShadow: '0 4px 20px rgba(27,42,31,0.25)',
            }}
          >
            {initials}
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: 20,
                fontWeight: 500,
                color: palette.ink,
                letterSpacing: '-0.01em',
              }}
            >
              {name}
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <Badge variant={ROLE_VARIANT[role] ?? 'default'}>
                {ROLE_LABELS[role] ?? role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div className="px-6 py-2">
          <InfoRow icon={Mail} label="Email" value={email} />
          <InfoRow icon={Phone} label="Nomor Telepon" value={phone} />
          <InfoRow icon={User} label="Nama Lengkap" value={name} />
          <div className="flex items-start gap-3 py-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(13,20,15,0.05)' }}
            >
              <CalendarDays size={14} style={{ color: palette.moss, opacity: 0.8 }} />
            </div>
            <div className="flex-1 min-w-0">
              <KostaSectionLabel className="mb-0.5">BERGABUNG SEJAK</KostaSectionLabel>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink }}>
                {joinDate}
              </div>
            </div>
          </div>
        </div>
      </KostaCard>
    </motion.div>
  )
}
