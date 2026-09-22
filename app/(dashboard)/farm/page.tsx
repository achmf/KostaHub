import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FarmPageClient from '@/components/Farm/FarmPageClient'

export default async function FarmPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'SUPER_ADMIN') redirect('/')

  const farms = await prisma.farm.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { hewan: true, members: true } }
    }
  })

  return <FarmPageClient farms={farms} />
}
