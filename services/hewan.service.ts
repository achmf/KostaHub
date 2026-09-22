import { prisma } from '@/lib/prisma'
import { type Kelamin, type KategoriHewan } from '@prisma/client'

export type SessionData = { role: string; activeFarmId?: string | null }

export async function createHewanLogic(data: any, session: SessionData, overrideFarmId?: string) {
  const farmId = session.role === 'SUPER_ADMIN' ? overrideFarmId : session.activeFarmId
  if (!farmId) return { error: 'Farm harus dipilih' }

  const existing = await prisma.hewan.findUnique({ where: { tag_farmId: { tag: data.tag, farmId } } })
  if (existing) return { error: `Tag "${data.tag}" sudah digunakan di farm ini` }

  if (data.rfidUid) {
    const checkRfid = await prisma.tagRfid.findUnique({ where: { rfidUid: data.rfidUid } })
    if (checkRfid) return { error: `RFID UID "${data.rfidUid}" sudah terdaftar di sistem` }
  }

  await prisma.hewan.create({
    data: {
      tag: data.tag,
      nama: data.nama || null,
      kelamin: data.kelamin as Kelamin,
      kategori: data.kategori as KategoriHewan,
      berat: typeof data.berat === 'number' ? data.berat : null,
      tanggalLahir: data.tanggalLahir,
      farmId,
      bapakId: data.bapakId || null,
      indukId: data.indukId || null,
      ...(data.rfidUid && { tagsRfid: { create: { rfidUid: data.rfidUid } } })
    }
  })
  return { success: true }
}

export async function transferHewanLogic(hewanId: string, toFarmId: string, alasan: string | undefined, session: SessionData) {
  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) return { error: 'Akses ditolak' }
  if (hewan.farmId === toFarmId) return { error: 'Hewan sudah berada di farm tersebut' }

  const tagConflict = await prisma.hewan.findUnique({ where: { tag_farmId: { tag: hewan.tag, farmId: toFarmId } } })
  if (tagConflict) return { error: `Transfer gagal: Tag "${hewan.tag}" sudah digunakan di farm tujuan. Ganti tag hewan ini terlebih dahulu sebelum melakukan transfer.` }

  await prisma.$transaction([
    prisma.transferHewan.create({
      data: { hewanId, fromFarmId: hewan.farmId, toFarmId, alasan: alasan || null, tanggal: new Date() }
    }),
    prisma.hewan.update({ where: { id: hewanId }, data: { farmId: toFarmId } })
  ])
  return { success: true }
}

export async function editHewanLogic(hewanId: string, data: any, session: SessionData) {
  const existing = await prisma.hewan.findUnique({ 
    where: { id: hewanId },
    include: { tagsRfid: { where: { status: 'AKTIF' } } }
  })
  if (!existing) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && existing.farmId !== session.activeFarmId) return { error: 'Akses ditolak' }

  if (data.tag !== existing.tag) {
    const checkTag = await prisma.hewan.findUnique({ where: { tag_farmId: { tag: data.tag, farmId: existing.farmId } } })
    if (checkTag) return { error: `Tag "${data.tag}" sudah digunakan di farm ini` }
  }

  const activeTag = existing.tagsRfid[0]

  if (data.rfidUid && (!activeTag || activeTag.rfidUid !== data.rfidUid)) {
    const checkRfid = await prisma.tagRfid.findUnique({ where: { rfidUid: data.rfidUid } })
    if (checkRfid) return { error: `RFID UID "${data.rfidUid}" sudah digunakan oleh hewan lain` }
  }

  await prisma.$transaction(async (tx) => {
    if (data.rfidUid !== (activeTag?.rfidUid || null)) {
      if (activeTag) {
        await tx.tagRfid.update({ where: { id: activeTag.id }, data: { status: 'DICOPOT', tanggalCopot: new Date() } })
      }
      if (data.rfidUid) {
        await tx.tagRfid.create({ data: { hewanId, rfidUid: data.rfidUid } })
      }
    }

    await tx.hewan.update({
      where: { id: hewanId },
      data: {
        tag: data.tag,
        nama: data.nama || null,
        kelamin: data.kelamin as Kelamin,
        kategori: data.kategori as KategoriHewan,
        tanggalLahir: data.tanggalLahir,
        bapakId: data.bapakId || null,
        indukId: data.indukId || null,
      }
    })
  })

  return { success: true }
}

export async function updateFotoHewanLogic(hewanId: string, fotoUrl: string, session: SessionData) {
  const existing = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!existing) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && existing.farmId !== session.activeFarmId) return { error: 'Akses ditolak' }

  await prisma.hewan.update({ where: { id: hewanId }, data: { fotoUrl } })
  return { success: true }
}
