import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StatusClient from './StatusClient'

export default async function StatusPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Ambil semua farm user — diurutkan terbaru dulu
  const userFarms = await prisma.userFarm.findMany({
    where: { userId: session.id },
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
    orderBy: { assignedAt: 'desc' },
  })

  // Prioritas: tampilkan farm yang DITOLAK lebih dulu (perlu tindakan user)
  const rejectedFarm = userFarms.find(
    (uf) => uf.farm.status === 'NONAKTIF' && uf.farm.rejectionReason
  )

  // Jika tidak ada farm ditolak → cek farm pending
  const pendingFarm = !rejectedFarm
    ? userFarms.find((uf) => uf.farm.status === 'NONAKTIF' && !uf.farm.rejectionReason)
    : null

  // Tidak ada farm yang perlu ditampilkan di /status → arahkan ke pilih farm atau dashboard
  if (!rejectedFarm && !pendingFarm) {
    const activeFarms = userFarms.filter((uf) => uf.farm.status === 'AKTIF')
    redirect(activeFarms.length > 0 ? '/' : '/farms/new')
  }

  const displayFarm = rejectedFarm ?? pendingFarm!
  const farmStatus  = rejectedFarm ? 'REJECTED' : 'PENDING'
  const farm = displayFarm.farm

  return (
    <StatusClient
      status={farmStatus as 'PENDING' | 'REJECTED'}
      rejectionReason={farm.rejectionReason ?? null}
      farm={{
        nama: farm.nama,
        alamat: farm.alamat ?? '',
        deskripsi: farm.deskripsi ?? '',
        sertifikatUrl: farm.sertifikatUrl ?? null,
        lat: farm.lat ?? null,
        lng: farm.lng ?? null,
      }}
    />
  )
}
