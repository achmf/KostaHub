import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import FarmRevisiClient from './FarmRevisiClient'

interface Props {
  params: Promise<{ farmId: string }>
}

export default async function FarmRevisiPage({ params }: Props) {
  const { farmId } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'OWNER') redirect('/')

  // Verifikasi: farm ini milik user ini DAN statusnya ditolak
  const userFarm = await prisma.userFarm.findUnique({
    where: { userId_farmId: { userId: session.id, farmId } },
    include: {
      farm: {
        select: {
          id: true,
          nama: true,
          alamat: true,
          deskripsi: true,
          sertifikatUrl: true,
          lat: true,
          lng: true,
          status: true,
          rejectionReason: true,
        },
      },
    },
  })

  // Farm tidak ditemukan atau bukan milik user ini
  if (!userFarm) redirect('/farms')

  const farm = userFarm.farm

  // Farm tidak dalam status ditolak — tidak perlu revisi
  // Gunakan explicit null check karena rejectionReason bisa berupa string kosong ""
  if (farm.status === 'AKTIF' || farm.rejectionReason === null) redirect('/farms')

  return (
    <FarmRevisiClient
      farmId={farm.id}
      initialData={{
        nama: farm.nama,
        alamat: farm.alamat ?? '',
        deskripsi: farm.deskripsi ?? '',
        sertifikatUrl: farm.sertifikatUrl ?? null,
        lat: farm.lat ?? null,
        lng: farm.lng ?? null,
      }}
      rejectionReason={farm.rejectionReason}
    />
  )
}
