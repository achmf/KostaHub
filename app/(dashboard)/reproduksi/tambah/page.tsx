import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TambahReproduksiForm } from '@/components/Reproduksi/TambahReproduksiForm'

export default async function TambahReproduksiPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const searchParams = await props.searchParams

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}

  const [indukan, pejantan] = await Promise.all([
    prisma.hewan.findMany({
      where: { kematian: { is: null }, kategori: 'INDUKAN', ...farmFilter },
      select: { id: true, tag: true, nama: true },
    }),
    prisma.hewan.findMany({
      where: { kematian: { is: null }, kategori: 'PEJANTAN', ...farmFilter },
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
