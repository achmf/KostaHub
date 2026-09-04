'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Building2, MapPin, ChevronRight, Plus, Clock, AlertCircle, XCircle } from 'lucide-react'
import { switchFarm } from '@/actions/switchFarm'
import { GoatMark } from '@/components/GoatMark'
import { logout } from '@/actions/auth'
import Link from 'next/link'

type Farm = {
  id: string
  nama: string
  alamat: string | null
  deskripsi: string | null
  status: string
  rejectionReason: string | null
  hewanAktif: number
  assignedAt: string
}

interface FarmPickerClientProps {
  farms: Farm[]
  userName: string
  userRole: string
  activeFarmId: string | null
}

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ochre: '#C7873E',
  ochreSoft: '#E2B883',
  ink: '#0D140F',
  inkMuted: 'rgba(13,20,15,0.5)',
  border: 'rgba(13,20,15,0.09)',
  card: '#FFFFFF',
}

export default function FarmPickerClient({ farms, userName, userRole, activeFarmId }: FarmPickerClientProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(activeFarmId)
  const [isPending, startTransition] = useTransition()

  const activeFarms = farms.filter((f) => f.status === 'AKTIF')
  const rejectedFarms = farms.filter((f) => f.status !== 'AKTIF' && f.rejectionReason !== null)
  const waitingFarms = farms.filter((f) => f.status !== 'AKTIF' && f.rejectionReason === null)

  function handleSelectFarm(farmId: string) {
    setSelectedFarmId(farmId)
    startTransition(async () => {
      await switchFarm(farmId)
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: palette.cream, color: palette.ink }}
    >
      {/* Top bar */}
      <div
        className="px-6 md:px-10 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${palette.border}` }}
      >
        <div className="flex items-center gap-2.5">
          <GoatMark className="w-7 h-7" />
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 18 }}>
            KostaHub
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(13,20,15,0.05)', border: `1px solid ${palette.border}` }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{ background: palette.ochre, color: palette.cream, fontFamily: "'Fraunces',serif" }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>{userName}</span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="cursor-pointer px-3 py-1.5 rounded-full text-xs"
              style={{
                fontFamily: "'Inter',sans-serif",
                border: `1px solid ${palette.border}`,
                color: palette.inkMuted,
              }}
            >
              Keluar
            </button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-2xl"
        >
          {/* Heading */}
          <div className="mb-10">
            <p
              className="mb-2"
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                letterSpacing: '0.2em',
                color: palette.ochre,
              }}
            >
              PILIH FARM
            </p>
            <h1
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: 'clamp(28px, 5vw, 40px)',
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: palette.ink,
              }}
            >
              Farm mana yang ingin<br />
              kamu kelola hari ini?
            </h1>
            {farms.length > 0 && (
              <p
                className="mt-3"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.inkMuted }}
              >
            Kamu memiliki <strong style={{ color: palette.ink }}>{activeFarms.length}</strong> farm aktif
                {waitingFarms.length > 0 && ` dan ${waitingFarms.length} menunggu persetujuan`}
                {rejectedFarms.length > 0 && `, ${rejectedFarms.length} ditolak`}.
              </p>
            )}
          </div>

          {/* Farm cards */}
          <div className="flex flex-col gap-3">
            {activeFarms.length === 0 && waitingFarms.length === 0 && rejectedFarms.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Building2 size={40} className="mx-auto mb-4" style={{ color: palette.inkMuted, opacity: 0.4 }} />
                <p style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: palette.inkMuted }}>
                  Belum ada farm terdaftar
                </p>
                <p className="mt-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.inkMuted, opacity: 0.7 }}>
                  Tambahkan farm pertama kamu untuk mulai mengelola peternakan
                </p>
              </motion.div>
            )}

            {/* Active farms */}
            {activeFarms.map((farm, i) => {
              const isSelected = selectedFarmId === farm.id
              const isLoading = isPending && selectedFarmId === farm.id

              return (
                <motion.button
                  key={farm.id}
                  id={`farm-card-${farm.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => handleSelectFarm(farm.id)}
                  disabled={isPending}
                  className="w-full text-left cursor-pointer rounded-2xl p-5 flex items-center gap-4 group hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: isSelected ? palette.forest : palette.card,
                    border: `1.5px solid ${isSelected ? palette.forest : palette.border}`,
                    transition: 'all 0.25s ease',
                    boxShadow: isSelected
                      ? '0 8px 32px rgba(13,20,15,0.18)'
                      : '0 1px 4px rgba(13,20,15,0.06)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: isSelected ? 'rgba(199,135,62,0.18)' : 'rgba(13,20,15,0.04)',
                      transition: 'background 0.25s ease',
                    }}
                  >
                    {isLoading ? (
                      <div
                        className="w-5 h-5 rounded-full border-2 animate-spin"
                        style={{
                          borderColor: `${palette.ochre} transparent transparent transparent`,
                        }}
                      />
                    ) : (
                      <Building2
                        size={20}
                        style={{ color: isSelected ? palette.ochreSoft : palette.inkMuted }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        style={{
                          fontFamily: "'Fraunces',serif",
                          fontSize: 17,
                          fontWeight: 600,
                          color: isSelected ? palette.cream : palette.ink,
                          transition: 'color 0.25s ease',
                        }}
                      >
                        {farm.nama}
                      </span>
                      {activeFarmId === farm.id && !isSelected && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: 'rgba(199,135,62,0.12)',
                            color: palette.ochre,
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          Aktif
                        </span>
                      )}
                    </div>

                    {farm.alamat && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin size={11} style={{ color: isSelected ? palette.ochreSoft : palette.inkMuted, opacity: 0.7 }} />
                        <span
                          className="truncate"
                          style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: isSelected ? 'rgba(242,237,224,0.6)' : palette.inkMuted,
                          }}
                        >
                          {farm.alamat}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 11,
                          color: isSelected ? palette.ochreSoft : palette.ochre,
                        }}
                      >
                        {farm.hewanAktif} hewan aktif
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={16}
                    style={{
                      color: isSelected ? palette.ochreSoft : palette.inkMuted,
                      opacity: isSelected ? 1 : 0.5,
                      transition: 'all 0.25s ease',
                      transform: isSelected ? 'translateX(2px)' : 'translateX(0)',
                    }}
                  />
                </motion.button>
              )
            })}

            {/* Pending / waiting farms */}
            {waitingFarms.map((farm, i) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (activeFarms.length + i) * 0.07, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-2xl p-5 flex items-center gap-4"
                style={{
                  background: palette.card,
                  border: `1.5px dashed ${palette.border}`,
                  opacity: 0.7,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(13,20,15,0.03)' }}
                >
                  <Clock size={20} style={{ color: palette.inkMuted }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 600, color: palette.ink }}>
                    {farm.nama}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AlertCircle size={11} style={{ color: palette.ochre }} />
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.inkMuted }}>
                      Menunggu persetujuan Super Admin
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Rejected farms */}
            {rejectedFarms.map((farm, i) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (activeFarms.length + waitingFarms.length + i) * 0.07, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-2xl p-5 flex items-center gap-4"
                style={{
                  background: 'rgba(181,68,59,0.03)',
                  border: `1.5px solid rgba(181,68,59,0.25)`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(181,68,59,0.08)' }}
                >
                  <XCircle size={20} style={{ color: '#B5443B' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 600, color: palette.ink }}>
                    {farm.nama}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AlertCircle size={11} style={{ color: '#B5443B' }} />
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#B5443B' }}>
                      Pendaftaran ditolak
                    </span>
                  </div>
                  {farm.rejectionReason && (
                    <div className="mt-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(13,20,15,0.5)', lineHeight: 1.4 }}>
                      Alasan: {farm.rejectionReason}
                    </div>
                  )}
                  <Link
                    href={`/farms/revisi/${farm.id}`}
                    className="inline-block mt-2"
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#C7873E', textDecoration: 'underline' }}
                  >
                    Revisi &amp; ajukan ulang →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Daftarkan farm baru — hanya untuk Owner tanpa farm pending/rejected */}
          {userRole === 'OWNER' && waitingFarms.length === 0 && rejectedFarms.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4"
            >
              <Link
                id="btn-add-farm"
                href="/farms/new"
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2"
                style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 14,
                  color: palette.inkMuted,
                  border: `1.5px dashed rgba(13,20,15,0.18)`,
                  background: 'transparent',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(13,20,15,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(13,20,15,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(13,20,15,0.18)'
                }}
              >
                <Plus size={15} />
                Daftarkan Farm Baru
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>

    </div>
  )
}
