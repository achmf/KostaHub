import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { KostaPageHeader } from '@/components/KostaUI'
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard'
import { EditProfileForm } from '@/components/Profile/EditProfileForm'
import { ChangePasswordForm } from '@/components/Profile/ChangePasswordForm'
import { FarmMemberships } from '@/components/Profile/FarmMemberships'

export const metadata = {
  title: 'Profil Saya — KostaHub',
  description: 'Kelola informasi profil dan keamanan akun Anda di KostaHub.',
}

export default async function ProfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      farms: {
        select: {
          assignedAt: true,
          farm: {
            select: { id: true, nama: true, status: true },
          },
        },
      },
    },
  })

  // Jika akun tidak ditemukan atau sudah dihapus soft-delete
  if (!user) redirect('/login')

  return (
    <>
      <KostaPageHeader
        title="Profil Saya"
        description="Kelola informasi akun dan keamanan login Anda."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Kolom kiri: Info kartu */}
        <div className="flex flex-col gap-6">
          <ProfileInfoCard
            name={user.name}
            email={user.email}
            phone={user.phone ?? null}
            role={user.role}
            createdAt={user.createdAt}
          />

          <FarmMemberships farms={user.farms} />
        </div>

        {/* Kolom kanan: Form edit */}
        <div className="flex flex-col gap-6">
          <EditProfileForm name={user.name} phone={user.phone ?? null} />
          <ChangePasswordForm />
        </div>
      </div>
    </>
  )
}
