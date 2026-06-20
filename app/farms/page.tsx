import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import FarmPickerClient from './FarmPickerClient'

export default async function FarmsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'SUPER_ADMIN') redirect('/admin')

  // Ambil semua farm yang dimiliki user ini
  const userFarms = await prisma.userFarm.findMany({
    where: { userId: session.id },
    include: {
      farm: {
        include: {
          _count: {
            select: { hewan: { where: { status: 'AKTIF' } } }
          }
        }
      }
    },
    orderBy: { assignedAt: 'asc' },
  })

  const farms = userFarms.map((uf) => ({
    id: uf.farm.id,
    nama: uf.farm.nama,
    alamat: uf.farm.alamat,
    deskripsi: uf.farm.deskripsi,
    status: uf.farm.status,
    rejectionReason: uf.farm.rejectionReason,
    hewanAktif: uf.farm._count.hewan,
    assignedAt: uf.assignedAt.toISOString(),
  }))

  return (
    <FarmPickerClient
      farms={farms}
      userName={session.name}
      userRole={session.role}
      activeFarmId={session.activeFarmId}
    />
  )
}
