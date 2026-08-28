'use client'

import { Building2, Users, Activity, MapPin } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { switchFarm } from '@/actions/switchFarm'
import PaginationControl from './PaginationControl'
import { usePagination } from '@/hooks/usePagination'

const palette = {
  cream: '#F2EDE0',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  danger: '#B5443B',
}

interface FarmData {
  id: string
  status: string
  nama: string
  alamat: string | null
  createdAt: Date
  _count: {
    hewan: number
    members: number
  }
}

const PER_PAGE = 12

export default function AdminFarmsClient({ farms }: { farms: FarmData[] }) {
  const { paged: currentFarms, page, totalPages, onPrev, onNext } = usePagination(farms, PER_PAGE)

  if (farms.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Belum ada farm terdaftar"
        description="Farm yang didaftarkan owner akan muncul di sini."
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {currentFarms.map((farm) => {
          const isAktif = farm.status === 'AKTIF'
          const isNonaktif = farm.status === 'NONAKTIF'
          return (
            <div
              key={farm.id}
              className="block group rounded-2xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col"
              style={{ background: '#fff', border: `1px solid ${palette.border}`, height: '100%' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: isAktif ? 'rgba(63,91,58,0.10)' : 'rgba(181,68,59,0.08)' }}
                >
                  <Building2 size={19} style={{ color: isAktif ? palette.moss : palette.danger }} />
                </div>
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    background: isAktif ? 'rgba(63,91,58,0.10)' : isNonaktif ? 'rgba(181,68,59,0.08)' : 'rgba(13,20,15,0.06)',
                    color: isAktif ? palette.moss : isNonaktif ? palette.danger : 'rgba(13,20,15,0.45)',
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8,
                    letterSpacing: '0.12em',
                  }}
                >
                  {farm.status}
                </span>
              </div>

              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 500, color: palette.ink }}>
                {farm.nama}
              </div>

              {farm.alamat && (
                <div className="flex items-start gap-2 mt-2" style={{ fontSize: 12, color: 'rgba(13,20,15,0.45)', fontFamily: "'Inter',sans-serif", lineHeight: 1.4 }}>
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span>{farm.alamat}</span>
                </div>
              )}

              <div
                className="flex items-center gap-5 mt-4 pt-4"
                style={{ borderTop: `1px solid ${palette.border}` }}
              >
                <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'rgba(13,20,15,0.5)', fontFamily: "'Inter',sans-serif" }}>
                  <Activity size={12} style={{ color: palette.ochre }} />
                  <span style={{ fontWeight: 600, color: palette.ink }}>{farm._count.hewan}</span> hewan
                </div>
                <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'rgba(13,20,15,0.5)', fontFamily: "'Inter',sans-serif" }}>
                  <Users size={12} style={{ color: palette.ochre }} />
                  <span style={{ fontWeight: 600, color: palette.ink }}>{farm._count.members}</span> user
                </div>
                {farm.createdAt && (
                  <div className="ml-auto" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.35)' }}>
                    {new Date(farm.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2 mt-5">
                <Link
                  href={`/admin/farms/${farm.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-colors hover:bg-black/5"
                  style={{ background: 'rgba(13,20,15,0.04)', color: palette.ink, fontFamily: "'Inter',sans-serif", fontWeight: 500 }}
                >
                  Detail Farm
                </Link>
                <form action={switchFarm.bind(null, farm.id)} className="flex-1 flex">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-opacity hover:opacity-90"
                    style={{ background: palette.ochre, color: palette.cream, fontFamily: "'Inter',sans-serif", fontWeight: 500 }}
                  >
                    Masuk Dashboard
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>

      <PaginationControl 
        page={page}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
        totalItems={farms.length}
        perPage={PER_PAGE}
      />
    </>
  )
}
