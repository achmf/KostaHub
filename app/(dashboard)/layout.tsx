import Sidebar from '@/components/Layout/Sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GoatMark } from '@/components/GoatMark'
import FarmSelector from '@/components/Layout/FarmSelector'
import { Search } from 'lucide-react'
import UserDropdown from '@/components/Layout/UserDropdown'
import NotificationDropdown from '@/components/Layout/NotificationDropdown'

import { palette } from '@/components/KostaUI'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'SUPER_ADMIN') redirect('/admin')

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

  // Super Admin bisa lihat semua farm (tidak akan masuk ke sini, tapi untuk safety)
  if (session.role === 'SUPER_ADMIN') {
    allFarms = await prisma.farm.findMany({ select: { id: true, nama: true } })
  }

  return (
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
        {/* Header */}
        <header
          className="sticky top-0 z-30 px-6 md:px-10 py-4 flex items-center justify-between gap-4"
          style={{
            background: 'rgba(242,237,224,0.85)',
            backdropFilter: 'blur(8px)',
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-2" style={{ color: palette.ink }}>
              <GoatMark className="w-6 h-6" />
              <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600 }}>KostaHub</span>
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

          <div className="flex items-center gap-2 md:gap-3">
            {/* Search pill */}
            <div
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full"
              style={{
                background: 'rgba(13,20,15,0.04)',
                border: `1px solid ${palette.border}`,
              }}
            >
              <Search size={14} style={{ opacity: 0.5 }} />
              <input
                placeholder="Cari tag, nama, dokter…"
                className="bg-transparent outline-none w-44"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
              />
            </div>

            {/* Farm selector — super admin only (fallback, karena SUPER_ADMIN diredirect ke /admin) */}
            {session.role === 'SUPER_ADMIN' && <FarmSelector farms={allFarms} />}

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

        {/* Page content */}
        <main className="flex-1 px-6 md:px-10 py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
