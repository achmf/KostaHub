import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard'
import ClientEditStaffForm from '@/components/Staff/ClientEditStaffForm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { palette } from '@/components/KostaUI'

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN') redirect('/')
  if (!session.activeFarmId && session.role === 'OWNER') redirect('/')

  const staff = await prisma.user.findUnique({
    where: { id },
    include: { farms: true },
  })

  if (!staff || staff.deletedAt) redirect('/staff')

  // Verify ownership
  if (session.role === 'OWNER') {
    const isMemberOfActiveFarm = staff.farms.some((uf) => uf.farmId === session.activeFarmId)
    if (!isMemberOfActiveFarm) redirect('/staff')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/staff"
          className="inline-flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
          style={{ color: 'rgba(13,20,15,0.6)' }}
        >
          <ChevronLeft size={16} />
          Kembali ke Kelola Staff
        </Link>
        <h1
          style={{
            fontFamily: "'Fraunces',serif",
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
          }}
        >
          Profil Staff
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ProfileInfoCard
            name={staff.name}
            email={staff.email}
            phone={staff.phone}
            role={staff.role}
            createdAt={staff.createdAt}
          />
        </div>
        
        {session.role === 'OWNER' && (
          <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${palette.border}` }}>
            <div className="mb-6">
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 500 }}>
                Edit Profil Staff
              </h2>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
                Perbarui nama, nomor telepon, atau ubah password untuk {staff.name}.
              </p>
            </div>
            
            <ClientEditStaffForm staff={staff} />
          </div>
        )}
      </div>
    </div>
  )
}
