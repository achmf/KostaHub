import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MapPageClient from '@/components/Map/MapPageClient'

export default async function MapPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let farmId = session.farmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }

  const query = { include: { _count: { select: { hewan: true } } } } as const
  let farms: Awaited<ReturnType<typeof prisma.farm.findMany<typeof query>>>

  if (session.role === 'SUPER_ADMIN' && !searchParams.farmId) {
    farms = await prisma.farm.findMany(query)
  } else if (farmId) {
    farms = await prisma.farm.findMany({ ...query, where: { id: farmId } })
  } else {
    farms = []
  }

  const serialized = farms.map(f => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }))

  return (
    <MapPageClient farms={serialized} />
  )
}
