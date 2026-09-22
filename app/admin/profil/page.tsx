import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { KostaPageHeader } from '@/components/KostaUI'
import { ProfileInfoCard } from '@/components/Profile/ProfileInfoCard'
import { EditProfileForm } from '@/components/Profile/EditProfileForm'
import { ChangePasswordForm } from '@/components/Profile/ChangePasswordForm'

export const metadata = {
  title: 'Profil Saya — KostaHub Admin',
  description: 'Kelola informasi profil dan keamanan akun admin KostaHub.',
}

export default async function AdminProfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  // Hanya SUPER_ADMIN dan DINAS yang boleh akses /admin/*
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'DINAS') redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      // Admin tidak punya farm, tidak perlu di-fetch
    },
  })

  if (!user) redirect('/login')

  return (
    <>
      <KostaPageHeader
        title="Profil Saya"
        description="Kelola informasi akun dan keamanan login Anda."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Kolom kiri: Info kartu */}
        <ProfileInfoCard
          name={user.name}
          email={user.email}
          phone={user.phone ?? null}
          role={user.role}
          createdAt={user.createdAt}
        />

        {/* Kolom kanan: Form edit */}
        <div className="flex flex-col gap-6">
          <EditProfileForm name={user.name} phone={user.phone ?? null} />
          <ChangePasswordForm />
        </div>
      </div>
    </>
  )
}
