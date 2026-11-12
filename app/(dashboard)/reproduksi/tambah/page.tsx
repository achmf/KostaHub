import { prisma } from '@/lib/prisma'
import { getFarmSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TambahReproduksiForm } from '@/components/Reproduksi/TambahReproduksiForm'

export default async function TambahReproduksiPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getFarmSession()
  if (!session) redirect('/login')
  const searchParams = await props.searchParams

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}

  const batasLahir = new Date()
  batasLahir.setMonth(batasLahir.getMonth() - 8) // minimal berumur 8 bulan

  const [indukan, pejantan] = await Promise.all([
    prisma.hewan.findMany({
      where: { kematian: { is: null }, kelamin: 'BETINA', tanggalLahir: { lte: batasLahir }, ...farmFilter },
      select: { id: true, tag: true, nama: true },
    }),
    prisma.hewan.findMany({
      where: { kematian: { is: null }, kelamin: 'JANTAN', tanggalLahir: { lte: batasLahir }, ...farmFilter },
      select: { id: true, tag: true, nama: true },
    }),
  ])

  return (
    <TambahReproduksiForm
      indukan={indukan}
      pejantan={pejantan}
      isSuperAdmin={session.role === 'SUPER_ADMIN'}
    />
  )
}
