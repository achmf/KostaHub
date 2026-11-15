import { prisma } from '@/lib/prisma'
import { getFarmSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BeratPageClient from '@/components/Berat/BeratPageClient'

export default async function BeratPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getFarmSession()
  if (!session) redirect('/login')

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}

  const hewan = await prisma.hewan.findMany({
    where: { kematian: { is: null }, ...farmFilter },
    include: {
      // Seluruh riwayat (urut naik) untuk grafik tren & statistik penimbangan
      beratHistory: {
        orderBy: { tanggal: 'asc' },
        select: { id: true, berat: true, tanggal: true },
      },
      farm: { select: { nama: true } }
    },
    orderBy: { nama: 'asc' }
  })


  const serialized = hewan.map(h => ({
    ...h,
    tanggalLahir: h.tanggalLahir.toISOString(),
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
    beratHistory: h.beratHistory.map(b => ({
      ...b,
      tanggal: b.tanggal.toISOString(),
    }))
  }))

  return <BeratPageClient hewanList={serialized} canEdit={session.role !== 'DINAS'} />
}
