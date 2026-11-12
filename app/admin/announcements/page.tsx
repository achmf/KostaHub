import { redirect } from 'next/navigation'
import { getAnnouncements } from '@/actions/admin/sendAnnouncement'
import AdminAnnouncementsClient from '@/components/Admin/AdminAnnouncementsClient'
import { getSession } from '@/lib/auth'

export const metadata = { title: 'Pengumuman — Admin KostaHub' }

export default async function AnnouncementsPage() {
  const session = await getSession()
  if (session?.role !== 'SUPER_ADMIN') redirect('/admin')
  const history = await getAnnouncements()

  return (
    <AdminAnnouncementsClient
      userRole={session?.role || 'PETUGAS'}
      history={history.map((h) => ({
        title: h.title,
        message: h.message,
        createdAt: h.createdAt.toISOString(),
      }))}
    />
  )
}
