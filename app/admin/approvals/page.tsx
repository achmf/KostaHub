import { prisma } from '@/lib/prisma'
import ApprovalList from '@/components/Admin/ApprovalList'
import { CheckCircle2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function ApprovalsPage() {
  // Cari semua farm yang masih NONAKTIF (menunggu approval)
  const pendingFarms = await prisma.farm.findMany({
    where: { status: 'NONAKTIF', deletedAt: null, rejectionReason: null },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, createdAt: true },
          },
        },
        where: { user: { role: 'OWNER', deletedAt: null } },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Reshape ke format yang ApprovalList harapkan
  const pendingItems = pendingFarms.map((farm) => {
    const ownerMember = farm.members[0]
    return {
      // "user" disini adalah identitas owner yang akan ditampilkan di card
      id: farm.id, // ← pakai farmId bukan userId (untuk approve/reject farmId)
      name: ownerMember?.user?.name ?? '(Owner tidak diketahui)',
      email: ownerMember?.user?.email ?? '',
      phone: ownerMember?.user?.phone ?? null,
      createdAt: farm.createdAt,
      farm: {
        id: farm.id,
        nama: farm.nama,
        alamat: farm.alamat ?? null,
        lat: farm.lat ?? null,
        lng: farm.lng ?? null,
        deskripsi: farm.deskripsi ?? null,
        sertifikatUrl: farm.sertifikatUrl ?? null,
      },
    }
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
          Persetujuan Pendaftaran Farm
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.6)', marginTop: 4 }}>
          Review dan verifikasi farm baru yang menunggu aktivasi.
        </p>
      </div>

      {pendingItems.length === 0 ? (
        <div
          className="rounded-2xl"
          style={{ background: '#fff', border: '1px solid rgba(13,20,15,0.08)' }}
        >
          <EmptyState
            icon={CheckCircle2}
            title="Tidak ada farm yang menunggu"
            description="Semua pendaftaran farm sudah diproses."
          />
        </div>
      ) : (
        <ApprovalList users={pendingItems} />
      )}
    </div>
  )
}
