import { getAnnouncements } from '@/actions/admin/sendAnnouncement'
import AdminAnnouncementsClient from '@/components/Admin/AdminAnnouncementsClient'
import { getSession } from '@/lib/auth'

export const metadata = { title: 'Pengumuman — Admin KostaHub' }

export default async function AnnouncementsPage() {
  const history = await getAnnouncements()
  const session = await getSession()

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
