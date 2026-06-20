import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BeratPageClient from '@/components/Berat/BeratPageClient'

export default async function BeratPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}

  const hewan = await prisma.hewan.findMany({
    where: { status: 'AKTIF', ...farmFilter },
    include: {
      beratHistory: {
        orderBy: { tanggal: 'desc' },
        take: 1
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
      createdAt: b.createdAt.toISOString(),
    }))
  }))

  return <BeratPageClient hewanList={serialized} />
}
