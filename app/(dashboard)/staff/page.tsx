import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import StaffManager from '@/components/Staff/StaffManager'

export default async function StaffPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN') redirect('/')
  if (!session.farmId && session.role === 'OWNER') redirect('/')

  const farmId = session.farmId!
  const staff = await prisma.user.findMany({
    where: {
      farmId,
      role: { in: ['PETUGAS', 'DOKTER'] },
      approvalStatus: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
  })

  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { nama: true },
  })

  return (
    <div>
      <div className="mb-8">
        <div
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'rgba(13,20,15,0.5)',
            marginBottom: 6,
          }}
        >
          {farm?.nama?.toUpperCase() ?? 'FARM'}
        </div>
        <h1
          style={{
            fontFamily: "'Fraunces',serif",
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
          }}
        >
          Kelola Staff
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.6)', marginTop: 4 }}>
          Tambah atau hapus petugas dan dokter untuk farm Anda.
        </p>
      </div>

      <StaffManager staff={staff} isOwner={session.role === 'OWNER'} />
    </div>
  )
}
