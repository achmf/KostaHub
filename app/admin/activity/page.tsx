import { prisma } from '@/lib/prisma'
import AdminActivityClient from '@/components/Admin/AdminActivityClient'

export const metadata = { title: 'Activity Log — Admin KostaHub' }

export default async function ActivityPage() {
  // Aggregate recent activities from existing models

  // 1. Recent hewan added
  const recentHewan = await prisma.hewan.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      tag: true,
      nama: true,
      createdAt: true,
      farm: { select: { id: true, nama: true } },
    },
  })

  // 2. Recent rekam medis
  const recentMedis = await prisma.rekamMedis.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      tanggal: true,
      createdAt: true,
      kategori: true,
      diagnosis: true,
      hewan: {
        select: {
          tag: true,
          farm: { select: { id: true, nama: true } },
        },
      },
    },
  })

  // 3. Recent farm registrations (all statuses)
  const recentFarms = await prisma.farm.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nama: true,
      status: true,
      createdAt: true,
      members: {
        where: { user: { role: 'OWNER' } },
        take: 1,
        select: { user: { select: { name: true } } },
      },
    },
  })

  // 4. Recent user registrations
  const recentUsers = await prisma.user.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      role: true,
      createdAt: true,
      approvalStatus: true,
    },
  })

  // 5. Recent reproduksi events
  const recentReproduksi = await prisma.reproduksi.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      tanggalKawin: true,
      induk: {
        select: {
          tag: true,
          farm: { select: { id: true, nama: true } },
        },
      },
    },
  })

  // Build unified activity items
  type ActivityItem = {
    id: string
    type: 'hewan' | 'medis' | 'farm' | 'user' | 'reproduksi'
    title: string
    subtitle: string
    farmId?: string
    farmNama?: string
    timestamp: Date
  }

  const items: ActivityItem[] = [
    ...recentHewan.map((h) => ({
      id: `hewan-${h.id}`,
      type: 'hewan' as const,
      title: `Hewan baru: ${h.nama ?? h.tag}`,
      subtitle: `Tag ${h.tag} ditambahkan ke farm ${h.farm.nama}`,
      farmId: h.farm.id,
      farmNama: h.farm.nama,
      timestamp: h.createdAt,
    })),
    ...recentMedis.map((m) => ({
      id: `medis-${m.id}`,
      type: 'medis' as const,
      title: `Rekam medis: ${m.diagnosis.slice(0, 40)}${m.diagnosis.length > 40 ? '…' : ''}`,
      subtitle: `Hewan ${m.hewan.tag} di farm ${m.hewan.farm.nama} — ${m.kategori}`,
      farmId: m.hewan.farm.id,
      farmNama: m.hewan.farm.nama,
      timestamp: m.createdAt,
    })),
    ...recentFarms.map((f) => ({
      id: `farm-${f.id}`,
      type: 'farm' as const,
      title: `Farm ${f.status === 'AKTIF' ? 'disetujui' : f.status === 'NONAKTIF' ? 'mendaftar' : 'diperbarui'}: ${f.nama}`,
      subtitle: `Owner: ${f.members[0]?.user?.name ?? 'Tidak diketahui'} — Status: ${f.status}`,
      farmId: f.id,
      farmNama: f.nama,
      timestamp: f.createdAt,
    })),
    ...recentUsers.map((u) => ({
      id: `user-${u.id}`,
      type: 'user' as const,
      title: `User baru: ${u.name}`,
      subtitle: `Role: ${u.role} — Status: ${u.approvalStatus}`,
      timestamp: u.createdAt,
    })),
    ...recentReproduksi.map((r) => ({
      id: `repro-${r.id}`,
      type: 'reproduksi' as const,
      title: `Reproduksi ${r.status.toLowerCase()}: Induk ${r.induk.tag}`,
      subtitle: `Farm ${r.induk.farm.nama} — Kawin: ${new Date(r.tanggalKawin).toLocaleDateString('id-ID')}`,
      farmId: r.induk.farm.id,
      farmNama: r.induk.farm.nama,
      timestamp: r.createdAt,
    })),
  ]

  // Sort descending by timestamp, take 100 most recent
  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const activityItems = items.slice(0, 100).map((i) => ({
    ...i,
    timestamp: i.timestamp.toISOString(),
  }))

  return <AdminActivityClient activities={activityItems} />
}
