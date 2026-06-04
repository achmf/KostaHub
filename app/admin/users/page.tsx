import { prisma } from '@/lib/prisma'
import UserList from '@/components/Admin/UserList'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { approvalStatus: 'APPROVED' },
    include: { farm: { select: { id: true, nama: true } } },
    orderBy: { createdAt: 'desc' },
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
          BACKOFFICE
        </div>
        <h1
          style={{
            fontFamily: "'Fraunces',serif",
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
          }}
        >
          Manajemen User
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.6)', marginTop: 4 }}>
          Daftar semua user aktif di seluruh farm.
        </p>
      </div>

      <UserList users={users} />
    </div>
  )
}
