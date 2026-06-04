import Sidebar from '@/components/Layout/Sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GoatMark } from '@/components/GoatMark'
import FarmSelector from '@/components/Layout/FarmSelector'
import { Search } from 'lucide-react'

const palette = {
  cream: '#F2EDE0',
  border: 'rgba(13,20,15,0.10)',
  ink: '#0D140F',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  let farmName: string | undefined
  let allFarms: { id: string; nama: string }[] = []

  if (session.role === 'SUPER_ADMIN') {
    allFarms = await prisma.farm.findMany({ select: { id: true, nama: true } })
  } else if (session.farmId) {
    const farm = await prisma.farm.findUnique({ where: { id: session.farmId }, select: { nama: true } })
    farmName = farm?.nama
  }

  return (
    <div className="min-h-screen flex" style={{ background: palette.cream, color: palette.ink }}>
      <Sidebar
        role={session.role}
        name={session.name}
        email={session.email ?? ''}
        farmName={farmName}
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
            {/* Desktop breadcrumb */}
            <span
              className="hidden lg:block"
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                letterSpacing: '0.15em',
                color: 'rgba(13,20,15,0.5)',
              }}
            >
              KOSTAHUB
            </span>
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

            {/* Farm selector — super admin only */}
            {session.role === 'SUPER_ADMIN' && <FarmSelector farms={allFarms} />}

            {/* User chip */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{
                border: `1px solid ${palette.border}`,
                background: '#fff',
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: '#C7873E',
                  color: palette.cream,
                  fontFamily: "'Fraunces',serif",
                  fontSize: 11,
                }}
              >
                {session.name.charAt(0).toUpperCase()}
              </div>
              <span
                className="hidden md:block"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
              >
                {session.name}
              </span>
            </div>
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
