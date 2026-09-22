import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/Admin/AdminSidebar'
import { Bell, ShieldCheck } from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'
import Link from 'next/link'
import UserDropdown from '@/components/Layout/UserDropdown'
import { MobileMenuProvider } from '@/components/Layout/MobileMenuContext'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'

const palette = {
  cream: '#F2EDE0',
  border: 'rgba(13,20,15,0.10)',
  ink: '#0D140F',
  ochre: '#C7873E',
  forest: '#1B2A1F',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'DINAS') redirect('/')

  const pendingCount = await prisma.user.count({
    where: { approvalStatus: 'PENDING', deletedAt: null },
  })

  return (
    <MobileMenuProvider>
    <div className="min-h-screen flex" style={{ background: palette.cream, color: palette.ink }}>
      <AdminSidebar
        name={session.name}
        email={session.email ?? ''}
        pendingCount={pendingCount}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 px-4 sm:px-6 lg:px-10 py-3 lg:py-3.5 flex items-center justify-between gap-3"
          style={{
            background: 'rgba(242,237,224,0.90)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-2 min-w-0" style={{ color: palette.ink }}>
              <MobileMenuButton />
              <GoatMark className="w-6 h-6 shrink-0" />
              <div className="min-w-0 leading-tight">
                <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600 }}>KostaHub</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: palette.ochre }}>ADMIN</div>
              </div>
            </div>
            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-2">
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  color: 'rgba(13,20,15,0.4)',
                }}
              >
                ADMIN
              </span>
              <span style={{ color: 'rgba(13,20,15,0.3)', fontSize: 12 }}>/</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  color: 'rgba(13,20,15,0.7)',
                }}
              >
                BACKOFFICE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Notification bell */}
            {pendingCount > 0 && (
              <Link
                href="/admin/approvals"
                className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all hover:bg-black/5"
                aria-label={`${pendingCount} permohonan menunggu persetujuan`}
                style={{ border: `1px solid ${palette.border}` }}
              >
                <Bell size={15} style={{ color: palette.ink, opacity: 0.7 }} />
                <span
                  className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center"
                  style={{
                    background: '#B5443B',
                    color: '#fff',
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8,
                    width: 16,
                    height: 16,
                    fontWeight: 700,
                  }}
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              </Link>
            )}


            {/* User chip */}
            <UserDropdown
              name={session.name}
              email={session.email ?? ''}
              role={session.role}
              profileHref="/admin/profil"
              showRoleBadge={true}
            />
          </div>
        </header>

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
    </MobileMenuProvider>
  )
}
