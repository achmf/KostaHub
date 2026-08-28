'use client'

import PaginationControl from './PaginationControl'
import { usePagination } from '@/hooks/usePagination'

const palette = {
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  danger: '#B5443B',
  info: '#2C5F8A',
}

type FarmDetail = {
  id: string
  nama: string
  alamat?: string | null
  status: string
  aktif: number
  mati: number
  terjual: number
  hamil: number
  totalMedis: number
  lahir: number
  mortalityRate: number
  totalHewan: number
  _count: { members: number; hewan: number }
}

const PER_PAGE = 10

export default function AdminLaporanClient({ farmDetailList }: { farmDetailList: FarmDetail[] }) {
  const { paged: currentFarms, page, totalPages, onPrev, onNext } = usePagination(farmDetailList, PER_PAGE)

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ border: `1px solid ${palette.border}`, background: '#fff' }}>
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${palette.border}`, background: 'rgba(13,20,15,0.02)' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.45)' }}>
          DATA DETAIL PER FARM
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${palette.border}`, background: 'rgba(13,20,15,0.02)' }}>
              {['No', 'Nama Farm', 'Status', 'Hewan Aktif', 'Kematian', 'Terjual', 'Hamil', 'Rekam Medis', 'Mortality %', 'Staf'].map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-3"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.12em', color: 'rgba(13,20,15,0.45)', fontWeight: 400, whiteSpace: 'nowrap' }}
                >
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentFarms.map((farm, i) => {
              const globalIndex = page * PER_PAGE + i + 1
              return (
                <tr
                  key={farm.id}
                  style={{ borderBottom: i < currentFarms.length - 1 ? `1px solid ${palette.border}` : 'none' }}
                  className="hover:bg-black/[0.015] transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.4)' }}>
                      {String(globalIndex).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5, fontWeight: 500, color: palette.ink }}>
                      {farm.nama}
                    </div>
                    {farm.alamat && (
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(13,20,15,0.45)' }}>
                        {farm.alamat}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: farm.status === 'AKTIF' ? 'rgba(63,91,58,0.10)' : 'rgba(181,68,59,0.08)',
                        color: farm.status === 'AKTIF' ? palette.moss : palette.danger,
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 8,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {farm.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: palette.ink }}>{farm.aktif}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: farm.mati > 0 ? palette.danger : 'rgba(13,20,15,0.4)' }}>
                      {farm.mati}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: palette.ochre }}>{farm.terjual}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: palette.info }}>{farm.hamil}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: palette.moss }}>{farm.totalMedis}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 12,
                      fontWeight: 600,
                      color: farm.mortalityRate > 15 ? palette.danger : farm.mortalityRate > 7 ? palette.ochre : palette.moss,
                    }}>
                      {farm.mortalityRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(13,20,15,0.6)' }}>
                      {farm._count.members}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr style={{ borderTop: `2px solid ${palette.border}`, background: 'rgba(13,20,15,0.02)' }}>
              <td className="px-4 py-3.5" colSpan={3}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.12em', color: 'rgba(13,20,15,0.5)' }}>
                  TOTAL — {farmDetailList.length} FARM
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 500, color: palette.ink }}>
                  {farmDetailList.reduce((s, f) => s + f.aktif, 0)}
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 500, color: palette.danger }}>
                  {farmDetailList.reduce((s, f) => s + f.mati, 0)}
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 500, color: palette.ochre }}>
                  {farmDetailList.reduce((s, f) => s + f.terjual, 0)}
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 500, color: palette.info }}>
                  {farmDetailList.reduce((s, f) => s + f.hamil, 0)}
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 500, color: palette.moss }}>
                  {farmDetailList.reduce((s, f) => s + f.totalMedis, 0)}
                </span>
              </td>
              <td className="px-4 py-3.5" />
              <td className="px-4 py-3.5 text-center">
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 500, color: 'rgba(13,20,15,0.6)' }}>
                  {farmDetailList.reduce((s, f) => s + f._count.members, 0)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {farmDetailList.length > 0 && (
        <div className="px-5 pb-5 mt-4">
          <PaginationControl 
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            totalItems={farmDetailList.length}
            perPage={PER_PAGE}
          />
        </div>
      )}
    </div>
  )
}
