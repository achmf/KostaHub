import Sidebar from '@/components/Layout/Sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GoatMark } from '@/components/GoatMark'
import FarmSelector from '@/components/Layout/FarmSelector'
import UserDropdown from '@/components/Layout/UserDropdown'
import NotificationDropdown from '@/components/Layout/NotificationDropdown'
import { MobileMenuProvider } from '@/components/Layout/MobileMenuContext'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import AdminImpersonationBanner from '@/components/Layout/AdminImpersonationBanner'

import { palette } from '@/lib/palette'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if ((session.role === 'SUPER_ADMIN' || session.role === 'DINAS') && !session.activeFarmId) redirect('/admin')

  // Jika Owner/Staff belum memilih farm → redirect ke farm picker
  if (!session.activeFarmId) {
    redirect('/farms')
  }

  let farmName: string | undefined
  let allFarms: { id: string; nama: string }[] = []

  // Ambil nama farm yang sedang aktif
  if (session.activeFarmId) {
    const farm = await prisma.farm.findUnique({
      where: { id: session.activeFarmId },
      select: { nama: true },
    })
    farmName = farm?.nama
  }

  // SUPER_ADMIN dan DINAS bisa lihat semua farm
  if (session.role === 'SUPER_ADMIN' || session.role === 'DINAS') {
    allFarms = await prisma.farm.findMany({ select: { id: true, nama: true } })
  }

  return (
    <MobileMenuProvider>
      <div className="min-h-screen flex" style={{ background: palette.cream, color: palette.ink }}>
        <Sidebar
        role={session.role}
        name={session.name}
        email={session.email ?? ''}
        farmName={farmName}
        userId={session.id}
      />

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky top: banner (admin-only) + header, wrapped together so they move as a unit */}
        <div className="sticky top-0 z-30">
          {/* Impersonation banner — shown when SUPER_ADMIN or DINAS is viewing an owner farm */}
          {(session.role === 'SUPER_ADMIN' || session.role === 'DINAS') && session.activeFarmId && (
            <AdminImpersonationBanner farmName={farmName} role={session.role} />
          )}

          {/* Header */}
          <header
            className="px-4 sm:px-6 lg:px-10 py-3 lg:py-4 flex items-center justify-between gap-3"
            style={{
              background: 'rgba(242,237,224,0.85)',
              backdropFilter: 'blur(8px)',
              borderBottom: `1px solid ${palette.border}`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile brand & hamburger */}
              <div className="lg:hidden flex items-center gap-2 min-w-0" style={{ color: palette.ink }}>
                <MobileMenuButton />
                <GoatMark className="w-6 h-6 shrink-0" />
                <div className="min-w-0 leading-tight">
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600 }}>KostaHub</div>
                  {farmName && (
                    <div className="truncate" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: palette.ochre }}>
                      {farmName}
                    </div>
                  )}
                </div>
              </div>
              {/* Desktop farm name */}
              <div className="hidden lg:flex items-center gap-2">
                <span
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11,
                    letterSpacing: '0.15em',
                    color: 'rgba(13,20,15,0.5)',
                  }}
                >
                  KOSTAHUB
                </span>
                {farmName && (
                  <>
                    <span style={{ color: 'rgba(13,20,15,0.3)', fontSize: 12 }}>/</span>
                    <span
                      style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 12,
                        color: palette.ochre,
                      }}
                    >
                      {farmName}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {/* Search pill dihapus dari navbar, sekarang ada di tiap page */}

              {/* Farm selector — super admin only (fallback, karena SUPER_ADMIN diredirect ke /admin) */}
              {session.role === 'SUPER_ADMIN' && (
                <div className="hidden sm:block">
                  <FarmSelector farms={allFarms} />
                </div>
              )}

              {/* Notifications */}
              <NotificationDropdown />

              {/* User chip */}
              <UserDropdown
                name={session.name}
                email={session.email ?? ''}
                role={session.role}
                farmName={farmName}
              />
            </div>
          </header>
        </div>

        {/* Page content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
    </MobileMenuProvider>
  )
}
