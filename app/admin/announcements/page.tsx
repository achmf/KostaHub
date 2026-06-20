import { getAnnouncements } from '@/actions/admin/sendAnnouncement'
import AdminAnnouncementsClient from '@/components/Admin/AdminAnnouncementsClient'

export const metadata = { title: 'Pengumuman — Admin KostaHub' }

export default async function AnnouncementsPage() {
  const history = await getAnnouncements()

  return (
    <AdminAnnouncementsClient
      history={history.map((h) => ({
        title: h.title,
        message: h.message,
        createdAt: h.createdAt.toISOString(),
      }))}
    />
  )
}
