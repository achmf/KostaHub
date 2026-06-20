'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }
  return session
}

// ── Send Announcement to all active farms ──────────────────────────────────
export async function sendAnnouncement(data: { title: string; message: string }) {
  await requireSuperAdmin()

  const { title, message } = data
  if (!title?.trim() || !message?.trim()) {
    return { error: 'Judul dan pesan tidak boleh kosong' }
  }

  const activeFarms = await prisma.farm.findMany({
    where: { status: 'AKTIF' },
    select: { id: true },
  })

  if (activeFarms.length === 0) {
    return { error: 'Tidak ada farm aktif untuk dikirim pengumuman' }
  }

  // Create one Notifikasi per active farm (type CUSTOM)
  await prisma.notifikasi.createMany({
    data: activeFarms.map((f) => ({
      title,
      message,
      tanggal: new Date(),
      type: 'CUSTOM',
      farmId: f.id,
    })),
  })

  revalidatePath('/admin/announcements')
  return { success: true, count: activeFarms.length }
}

// ── Get past announcements (CUSTOM type) ────────────────────────────────────
export async function getAnnouncements() {
  await requireSuperAdmin()

  // Get unique announcements by title+message (since one record per farm)
  const notifs = await prisma.notifikasi.findMany({
    where: { type: 'CUSTOM' },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { title: true, message: true, createdAt: true },
  })

  // Deduplicate by title+message+date
  const seen = new Set<string>()
  return notifs.filter((n) => {
    const key = `${n.title}|${n.message}|${n.createdAt.toDateString()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 20)
}
