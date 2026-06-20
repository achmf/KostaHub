import { prisma } from '@/lib/prisma'
import { FileText, Building2, Activity, Users, Heart } from 'lucide-react'
import LaporanExportButton from '@/components/Admin/LaporanExportButton'

const palette = {
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  danger: '#B5443B',
  info: '#2C5F8A',
}

export default async function AdminLaporanPage() {
  const farms = await prisma.farm.findMany({
    include: {
      _count: { select: { members: true, hewan: true } },
    },
    orderBy: { nama: 'asc' },
  })

  const farmDetailList = await Promise.all(
    farms.map(async (farm) => {
      const [aktif, mati, terjual, hamil, totalMedis, lahir] = await Promise.all([
        prisma.hewan.count({ where: { farmId: farm.id, status: 'AKTIF' } }),
        prisma.hewan.count({ where: { farmId: farm.id, status: 'MATI' } }),
        prisma.hewan.count({ where: { farmId: farm.id, status: 'TERJUAL' } }),
        prisma.reproduksi.count({ where: { induk: { farmId: farm.id }, status: 'HAMIL' } }),
        prisma.rekamMedis.count({ where: { hewan: { farmId: farm.id } } }),
        prisma.reproduksi.count({ where: { induk: { farmId: farm.id }, status: 'LAHIR' } }),
      ])
      const totalSemua = aktif + mati + terjual
      const mortalityRate = totalSemua > 0 ? Math.round((mati / totalSemua) * 100) : 0
      return {
        ...farm,
        aktif,
        mati,
        terjual,
        hamil,
        totalMedis,
        lahir,
        mortalityRate,
        totalHewan: totalSemua,
      }
    })
  )

  const now = new Date()
  const tanggalLaporan = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const totalHewan = farmDetailList.reduce((s, f) => s + f.aktif, 0)
  const totalMati = farmDetailList.reduce((s, f) => s + f.mati, 0)
  const totalUser = farmDetailList.reduce((s, f) => s + f._count.members, 0)
  const totalMedis = farmDetailList.reduce((s, f) => s + f.totalMedis, 0)
  const farmAktif = farmDetailList.filter((f) => f.status === 'AKTIF').length

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
            LAPORAN RESMI
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em' }}>
            Laporan <span style={{ fontStyle: 'italic', color: palette.ochre }}>Regional</span>
          </h1>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.55)', marginTop: 4 }}>
            Data diperbarui otomatis dari sistem. Terakhir: {tanggalLaporan}
          </p>
        </div>
        <LaporanExportButton />
      </div>

      {/* Ringkasan Eksekutif */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: palette.forest, color: '#F2EDE0' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', opacity: 0.6, marginBottom: 8 }}>
          RINGKASAN EKSEKUTIF
        </div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 400, marginBottom: 16 }}>
          Status Peternakan Wilayah
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Farm Terdaftar', value: farms.length, icon: Building2 },
            { label: 'Farm Aktif', value: farmAktif, icon: Building2 },
            { label: 'Total Hewan', value: totalHewan, icon: Activity },
            { label: 'Total Kematian', value: totalMati, icon: Heart },
            { label: 'Total Staf', value: totalUser, icon: Users },
            { label: 'Rekam Medis', value: totalMedis, icon: FileText },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 400 }}>{s.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.12em', opacity: 0.55, marginTop: 4 }}>
                  {s.label.toUpperCase()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table Laporan per Farm */}
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
              {farmDetailList.map((farm, i) => (
                <tr
                  key={farm.id}
                  style={{ borderBottom: i < farmDetailList.length - 1 ? `1px solid ${palette.border}` : 'none' }}
                  className="hover:bg-black/[0.015] transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.4)' }}>
                      {String(i + 1).padStart(2, '0')}
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
              ))}
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
      </div>
    </div>
  )
}
