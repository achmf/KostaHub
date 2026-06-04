import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TambahBeratForm } from '@/components/Berat/TambahBeratForm'

export default async function TambahBeratPage(props: { searchParams: Promise<{ hewanId?: string; farmId?: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const searchParams = await props.searchParams
  const hewanId = searchParams?.hewanId

  let farmId = session.farmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams?.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}

  const hewanList = await prisma.hewan.findMany({
    where: { status: 'AKTIF', ...farmFilter },
    select: { id: true, tag: true, nama: true }
  })

  return <TambahBeratForm hewanList={hewanList} defaultHewanId={hewanId} />
}
