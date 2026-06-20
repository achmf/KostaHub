import { prisma } from '@/lib/prisma'
import AdminAnalyticsClient from '@/components/Admin/AdminAnalyticsClient'

export default async function AdminAnalyticsPage() {
  // ─── FARM DATA ────────────────────────────────────────────────
  const farms = await prisma.farm.findMany({
    select: { id: true, nama: true, status: true },
    orderBy: { createdAt: 'asc' },
  })

  // ─── HEWAN PER FARM (KATEGORI) ───────────────────────────────
  const hewanPerFarm = await Promise.all(
    farms.map(async (farm) => {
      const [indukan, pejantan, anakan, dara, jantanMuda, mati, terjual] = await Promise.all([
        prisma.hewan.count({ where: { farmId: farm.id, kategori: 'INDUKAN', status: 'AKTIF' } }),
        prisma.hewan.count({ where: { farmId: farm.id, kategori: 'PEJANTAN', status: 'AKTIF' } }),
        prisma.hewan.count({ where: { farmId: farm.id, kategori: 'ANAKAN', status: 'AKTIF' } }),
        prisma.hewan.count({ where: { farmId: farm.id, kategori: 'DARA', status: 'AKTIF' } }),
        prisma.hewan.count({ where: { farmId: farm.id, kategori: 'JANTAN_MUDA', status: 'AKTIF' } }),
        prisma.hewan.count({ where: { farmId: farm.id, status: 'MATI' } }),
        prisma.hewan.count({ where: { farmId: farm.id, status: 'TERJUAL' } }),
      ])
      const total = indukan + pejantan + anakan + dara + jantanMuda
      const totalSemua = total + mati + terjual
      return {
        id: farm.id,
        nama: farm.nama.length > 14 ? farm.nama.slice(0, 14) + '…' : farm.nama,
        namaPanjang: farm.nama,
        status: farm.status,
        indukan,
        pejantan,
        anakan,
        dara,
        jantanMuda,
        total,
        mati,
        terjual,
        mortalityRate: totalSemua > 0 ? Math.round((mati / totalSemua) * 100) : 0,
      }
    })
  )

  // ─── REPRODUKSI PER FARM ──────────────────────────────────────
  const reproduksiPerFarm = await Promise.all(
    farms.map(async (farm) => {
      const [lahir, gagal, hamil] = await Promise.all([
        prisma.reproduksi.count({ where: { induk: { farmId: farm.id }, status: 'LAHIR' } }),
        prisma.reproduksi.count({ where: { induk: { farmId: farm.id }, status: 'GAGAL' } }),
        prisma.reproduksi.count({ where: { induk: { farmId: farm.id }, status: 'HAMIL' } }),
      ])
      const total = lahir + gagal
      return {
        nama: farm.nama.length > 14 ? farm.nama.slice(0, 14) + '…' : farm.nama,
        namaPanjang: farm.nama,
        lahir,
        gagal,
        hamil,
        successRate: total > 0 ? Math.round((lahir / total) * 100) : 0,
      }
    })
  )

  // ─── DISTRIBUSI UMUR REGIONAL ─────────────────────────────────
  const allHewanAktif = await prisma.hewan.findMany({
    where: { status: 'AKTIF' },
    select: { tanggalLahir: true },
  })
  const now = new Date()
  const ageGroups = { '0–6 bln': 0, '6–12 bln': 0, '1–2 thn': 0, '2–3 thn': 0, '3+ thn': 0 }
  allHewanAktif.forEach((h) => {
    const months = (now.getTime() - h.tanggalLahir.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    if (months < 6) ageGroups['0–6 bln']++
    else if (months < 12) ageGroups['6–12 bln']++
    else if (months < 24) ageGroups['1–2 thn']++
    else if (months < 36) ageGroups['2–3 thn']++
    else ageGroups['3+ thn']++
  })
  const distribusiUmur = Object.entries(ageGroups)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)

  // ─── TOP DIAGNOSA ─────────────────────────────────────────────
  const allMedis = await prisma.rekamMedis.findMany({
    select: { diagnosis: true, kategori: true },
    take: 1000,
  })
  const diagMap = new Map<string, number>()
  allMedis.forEach((m) => {
    const d = m.diagnosis.trim()
    if (d) diagMap.set(d, (diagMap.get(d) || 0) + 1)
  })
  const topDiagnosa = Array.from(diagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // ─── KATEGORI MEDIS ───────────────────────────────────────────
  const kategoriMedisMap = new Map<string, number>()
  allMedis.forEach((m) => {
    kategoriMedisMap.set(m.kategori, (kategoriMedisMap.get(m.kategori) || 0) + 1)
  })
  const kategoriMedisData = Array.from(kategoriMedisMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name: name === 'VAKSINASI' ? 'Vaksinasi'
        : name === 'PENGOBATAN' ? 'Pengobatan'
        : name === 'PEMERIKSAAN' ? 'Pemeriksaan'
        : name === 'PERAWATAN_LUKA' ? 'Perawatan Luka'
        : name === 'VITAMIN' ? 'Vitamin'
        : 'Lainnya',
      value,
    }))

  return (
    <AdminAnalyticsClient
      hewanPerFarm={hewanPerFarm}
      reproduksiPerFarm={reproduksiPerFarm}
      distribusiUmur={distribusiUmur}
      topDiagnosa={topDiagnosa}
      kategoriMedisData={kategoriMedisData}
    />
  )
}
