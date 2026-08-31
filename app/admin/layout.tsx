import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/Admin/AdminSidebar'
import { Bell, ShieldCheck } from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'
import Link from 'next/link'
import UserDropdown from '@/components/Layout/UserDropdown'

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
  if (session.role !== 'SUPER_ADMIN') redirect('/')

  const pendingCount = await prisma.user.count({
    where: { approvalStatus: 'PENDING', deletedAt: null },
  })

  return (
    <div className="min-h-screen flex" style={{ background: palette.cream, color: palette.ink }}>
      <AdminSidebar
        name={session.name}
        email={session.email ?? ''}
        pendingCount={pendingCount}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 px-6 md:px-10 py-3.5 flex items-center justify-between gap-4"
          style={{
            background: 'rgba(242,237,224,0.90)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-2" style={{ color: palette.ink }}>
              <GoatMark className="w-6 h-6" />
              <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600 }}>KostaHub</span>
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

          <div className="flex items-center gap-2 md:gap-3">
            {/* Notification bell */}
            {pendingCount > 0 && (
              <Link
                href="/admin/approvals"
                className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-black/5"
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

            {/* Admin badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ background: 'rgba(199,135,62,0.10)', border: '1px solid rgba(199,135,62,0.25)' }}
            >
              <ShieldCheck size={11} style={{ color: palette.ochre }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 8,
                  letterSpacing: '0.12em',
                  color: palette.ochre,
                }}
              >
                SUPER ADMIN
              </span>
            </div>

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

        <main className="flex-1 px-6 md:px-10 py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
