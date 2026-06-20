import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HewanClient } from './HewanClient'

export default async function HewanPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}

  const hewanList = await prisma.hewan.findMany({
    where: farmFilter,
    include: { 
      farm: { select: { nama: true } },
      beratHistory: {
        orderBy: { tanggal: 'desc' },
        take: 3
      },
      rekamMedis: {
        select: { id: true } // only counting length is needed
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  return <HewanClient hewanList={hewanList} isSuperAdmin={isSuperAdmin} />
}
