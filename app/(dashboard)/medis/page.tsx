import { prisma } from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KostaPageHeader, KostaButton, KostaSectionLabel, palette } from '@/components/KostaUI'
import { HewanMedisList } from '@/components/Hewan/HewanMedisList'



export default async function MedisPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const hewans = await prisma.hewan.findMany({
    where: farmId ? { farmId } : {},
    include: {
      rekamMedis: {
        orderBy: { tanggal: 'desc' }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const medisList = hewans.flatMap(h => h.rekamMedis)

  const vaccinCount = medisList.filter((m) =>
    m.diagnosis.toLowerCase().includes('vaksin')
  ).length
  const uniqueDiagnoses = new Set(medisList.map((m) => m.diagnosis)).size
  const uniqueDoctors = new Set(medisList.map((m) => m.namaDokter).filter(Boolean)).size

  return (
    <div>
      <KostaPageHeader
        title="Riwayat Kesehatan"
        description={`${medisList.length} catatan medis tersimpan. Semua diagnosis, obat, dan tindakan terlacak per individu.`}
        action={
          <Link href="/medis/tambah">
            <KostaButton className="px-3 md:px-4">
              <Plus size={16} className="md:w-[13px] md:h-[13px]" /> <span>Tambah Rekam Medis</span>
            </KostaButton>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-6">
        {[
          { l: 'Catatan bulan ini', v: medisList.length, tone: palette.moss },
          { l: 'Vaksinasi PMK', v: vaccinCount, tone: palette.ochre },
          { l: 'Tindakan unik', v: uniqueDiagnoses, tone: palette.ink },
          { l: 'Dokter terlibat', v: uniqueDoctors, tone: palette.emerald },
        ].map((s, i) => (
          <div
            key={s.l}
            className="col-span-6 md:col-span-3 rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
            style={{ background: '#fff', border: `1px solid ${palette.border}` }}
          >
            <div className="flex items-center justify-between">
              <KostaSectionLabel>{s.l}</KostaSectionLabel>
            </div>
            <div
              className="mt-2"
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: 'clamp(28px, 8vw, 36px)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: s.tone,
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      {/* HewanMedisList handles mobile (individual cards) + desktop (KostaCard table) internally */}
      <HewanMedisList hewans={hewans} />
    </div>
  )
}
