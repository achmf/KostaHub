import { prisma } from '@/lib/prisma'
import { Plus, Heart } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KostaPageHeader, KostaCard, Badge, KostaButton, KostaSectionLabel, palette, KostaEmptyState } from '@/components/KostaUI'



function StatusBadge({ status }: { status: string }) {
  if (status === 'HAMIL') return <Badge variant="amber">Hamil</Badge>
  if (status === 'LAHIR') return <Badge variant="emerald">Lahir</Badge>
  return <Badge variant="rose">Gagal</Badge>
}

export default async function ReproduksiPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { induk: { farmId } } : {}

  const reproduksiList = await prisma.reproduksi.findMany({
    where: farmFilter,
    include: { induk: true, pejantan: true },
    orderBy: { estimasiLahir: 'asc' },
  })

  const hamil = reproduksiList.filter((r) => r.status === 'HAMIL').length
  const lahir = reproduksiList.filter((r) => r.status === 'LAHIR').length
  const gagal = reproduksiList.filter((r) => r.status === 'GAGAL').length
  const successRate = reproduksiList.length > 0
    ? Math.round((lahir / reproduksiList.length) * 100)
    : 0

  return (
    <div>
      <KostaPageHeader
        title="Perkawinan & Kehamilan"
        description="Estimasi kelahiran dihitung otomatis +150 hari dari tanggal kawin."
        action={
          <Link href="/reproduksi/tambah">
            <KostaButton>
              <Plus size={13} /> Catat Perkawinan
            </KostaButton>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        {[
          { l: 'Sedang hamil', v: hamil, tone: palette.amber, icon: <Heart size={14} /> },
          { l: 'Sudah lahir', v: lahir, tone: palette.emerald, icon: <Heart size={14} /> },
          { l: 'Gagal / keguguran', v: gagal, tone: palette.rose, icon: <Heart size={14} /> },
          { l: 'Success rate', v: `${successRate}%`, tone: palette.moss, icon: <Heart size={14} /> },
        ].map((s, i) => (
          <div
            key={s.l}
            className="col-span-6 md:col-span-3 rounded-2xl p-5"
            style={{ background: '#fff', border: `1px solid ${palette.border}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <KostaSectionLabel>{s.l}</KostaSectionLabel>
              <span style={{ color: s.tone }}>{s.icon}</span>
            </div>
            <div
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: 38,
                lineHeight: 1,
                letterSpacing: '-0.025em',
                color: s.tone,
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <KostaCard className="overflow-hidden">
        <div
          className="px-5 py-3 grid grid-cols-[1.4fr_1.4fr_0.9fr_1fr_0.7fr_0.8fr] gap-3"
          style={{
            background: 'rgba(13,20,15,0.03)',
            borderBottom: `1px solid ${palette.border}`,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'rgba(13,20,15,0.55)',
          }}
        >
          <div>INDUK ♀</div>
          <div>PEJANTAN ♂</div>
          <div>TGL KAWIN</div>
          <div>ESTIMASI LAHIR</div>
          <div>FARM</div>
          <div>STATUS</div>
        </div>
        {reproduksiList.length === 0 && (
          <KostaEmptyState
            title="Belum ada data reproduksi"
            hint="Catat perkawinan untuk mulai melacak kehamilan dan kelahiran."
          />
        )}
        {reproduksiList.map((r) => {
          const days = Math.ceil(
            (new Date(r.estimasiLahir).getTime() - Date.now()) / 86400000
          )
          return (
            <div
              key={r.id}
              className="px-5 py-3.5 grid grid-cols-[1.4fr_1.4fr_0.9fr_1fr_0.7fr_0.8fr] gap-3 items-center hover:bg-[rgba(13,20,15,0.025)]"
              style={{ borderBottom: `1px solid ${palette.border}` }}
            >
              <div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  {r.induk.nama || 'Tanpa Nama'}
                </div>
                <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                  {r.induk.tag}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  {r.pejantan.nama || 'Tanpa Nama'}
                </div>
                <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                  {r.pejantan.tag}
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>
                {new Date(r.tanggalKawin).toLocaleDateString('id-ID')}
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>
                  {new Date(r.estimasiLahir).toLocaleDateString('id-ID')}
                </div>
                {r.status === 'HAMIL' && (
                  <div className="opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>
                    {days > 0 ? `${days} hari lagi` : `${Math.abs(days)} hari lewat`}
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>—</div>
              <div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          )
        })}
      </KostaCard>
    </div>
  )
}
