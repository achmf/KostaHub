import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TambahHewanForm from '@/components/Hewan/TambahHewanForm'

export default async function TambahHewanPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const farmFilter = session.role === 'SUPER_ADMIN' ? {} : { farmId: session.activeFarmId as string }

  const [farms, semuaHewan] = await Promise.all([
    session.role === 'SUPER_ADMIN'
      ? prisma.farm.findMany({ where: { status: 'AKTIF' }, select: { id: true, nama: true } })
      : Promise.resolve([]),
    prisma.hewan.findMany({
      where: { status: 'AKTIF', ...farmFilter },
      select: { id: true, tag: true, nama: true, kelamin: true },
      orderBy: { tag: 'asc' },
    }),
  ])

  return (
    <TambahHewanForm
      isSuperAdmin={session.role === 'SUPER_ADMIN'}
      farms={farms}
      defaultFarmId={session.activeFarmId as string | null}
      semuaHewan={semuaHewan}
    />
  )
}
