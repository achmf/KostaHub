import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import EditHewanForm from '@/components/Hewan/EditHewanForm'

export default async function EditHewanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getSession()
  if (!session) redirect('/login')

  const farmFilter = session.role === 'SUPER_ADMIN' ? {} : { farmId: session.activeFarmId as string }

  const [hewan, semuaHewan] = await Promise.all([
    prisma.hewan.findUnique({ where: { id: params.id } }),
    prisma.hewan.findMany({
      where: { status: 'AKTIF', ...farmFilter },
      select: { id: true, tag: true, nama: true, kelamin: true },
      orderBy: { tag: 'asc' },
    }),
  ])

  if (!hewan) return notFound()

  if (session.role === 'FARM_OWNER' && hewan.farmId !== session.activeFarmId) {
    redirect('/hewan')
  }

  return <EditHewanForm hewan={hewan} semuaHewan={semuaHewan} />
}
