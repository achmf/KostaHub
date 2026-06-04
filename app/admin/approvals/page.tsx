import { prisma } from '@/lib/prisma'
import ApprovalList from '@/components/Admin/ApprovalList'
import { CheckCircle2 } from 'lucide-react'

export default async function ApprovalsPage() {
  const pendingUsers = await prisma.user.findMany({
    where: { approvalStatus: 'PENDING' },
    include: { farm: true },
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
          Persetujuan Pendaftaran
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.6)', marginTop: 4 }}>
          Review dan verifikasi pendaftaran owner farm baru.
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{
            background: '#fff',
            border: '1px solid rgba(13,20,15,0.08)',
          }}
        >
          <div className="flex items-center justify-center mb-3" style={{ color: '#3F5B3A' }}>
            <CheckCircle2 size={48} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18 }}>Tidak ada pendaftaran baru</div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)', marginTop: 4 }}>
            Semua pendaftaran sudah diproses.
          </div>
        </div>
      ) : (
        <ApprovalList users={pendingUsers} />
      )}
    </div>
  )
}
