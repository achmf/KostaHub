import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClientNotifList } from '@/components/Notifikasi/ClientNotifList'

export default async function NotifikasiPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const farmFilter = session.farmId ? { farmId: session.farmId } : {}

  const notifikasi = await prisma.notifikasi.findMany({
    where: farmFilter,
    orderBy: [{ isRead: 'asc' }, { tanggal: 'asc' }],
  })

  return (
    <ClientNotifList
      notifikasi={notifikasi.map((n) => ({
        ...n,
        tanggal: n.tanggal.toISOString(),
      }))}
    />
  )
}
