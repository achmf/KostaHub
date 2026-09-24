import { prisma } from '@/lib/prisma'
import { Plus, Heart } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KostaPageHeader, KostaCard, palette, KostaButton, KostaSectionLabel } from '@/components/KostaUI'
import ReproduksiClient from './ReproduksiClient'




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
    include: {
      induk: { select: { tag: true, nama: true, farm: { select: { nama: true } } } },
      pejantan: { select: { tag: true, nama: true } },
    },
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
        ].map((s) => (
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

      {/* ── Client Component List ── */}
      <ReproduksiClient reproduksiList={reproduksiList} />
    </div>
  )
}
