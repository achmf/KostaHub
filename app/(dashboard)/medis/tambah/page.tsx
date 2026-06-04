import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TambahMedisForm } from '@/components/Medis/TambahMedisForm'

export default async function TambahMedisPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const searchParams = await props.searchParams

  let farmId = session.farmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}

  const hewan = await prisma.hewan.findMany({
    where: { status: 'AKTIF', ...farmFilter },
    select: { id: true, tag: true, nama: true }
  })

  return <TambahMedisForm hewan={hewan} />
}
