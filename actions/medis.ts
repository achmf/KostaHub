'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export async function tambahRekamMedis(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const hewanId = formData.get('hewanId') as string
  if (!hewanId) return { error: 'Hewan tidak dipilih' }

  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) {
    return { error: 'Akses ditolak' }
  }
  const tanggal = new Date(formData.get('tanggal') as string)
  const kategori = formData.get('kategori') as string
  const diagnosis = formData.get('diagnosis') as string
  
  const obatKategori = formData.get('obat_kategori') as string
  const obatCustom = formData.get('obat_custom') as string
  let obat: string | null = obatKategori === 'LAINNYA' ? obatCustom : (obatKategori || null)
  if (obat === 'NONE' || obat === 'TIDAK_ADA') obat = null

  const notes = formData.get('notes') as string
  const dokter = formData.get('dokter') as string

  await prisma.rekamMedis.create({
    data: {
      hewanId,
      tanggal,
      kategori: kategori as import('@prisma/client').KategoriMedis,
      diagnosis,
      obat,
      notes: notes || null,
      namaDokter: dokter || null,
    }
  })

  // Check if it's a vaccine to create reminder
  if (kategori === 'VAKSINASI') {
    const nextVaksin = new Date(tanggal)
    nextVaksin.setMonth(nextVaksin.getMonth() + 6) // Example: 6 months later
    
    await prisma.notifikasi.create({
      data: {
        title: 'Jadwal Vaksin Lanjutan',
        message: `Hewan perlu divaksin ulang pada ${nextVaksin.toLocaleDateString()}`,
        tanggal: nextVaksin,
        type: 'VAKSIN'
      }
    })
  }

  redirect('/medis')
}
