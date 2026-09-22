import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClientNotifList } from '@/components/Notifikasi/ClientNotifList'

export default async function NotifikasiPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Data sekarang di-fetch client-side via /api/notifikasi dengan auto-generator
  return <ClientNotifList />
}
