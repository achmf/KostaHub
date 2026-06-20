'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { type Kelamin, type KategoriHewan, type StatusHewan } from '@prisma/client'

export async function tambahHewan(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const tag = formData.get('tag') as string
  const nama = formData.get('nama') as string
  const kelamin = formData.get('kelamin') as string
  const kategori = formData.get('kategori') as string
  const berat = parseFloat(formData.get('berat') as string)
  const tanggalLahir = new Date(formData.get('tanggalLahir') as string)
  const bapakId = (formData.get('bapakId') as string) || null
  const indukId = (formData.get('indukId') as string) || null

  // Super admin must select farm; others use their activeFarmId
  const farmId = session.role === 'SUPER_ADMIN'
    ? (formData.get('farmId') as string)
    : (session.activeFarmId as string)

  if (!farmId) return { error: 'Farm harus dipilih' }

  // Tag uniqueness: scoped to same farm only
  const existing = await prisma.hewan.findUnique({ where: { tag_farmId: { tag, farmId } } })
  if (existing) return { error: `Tag "${tag}" sudah digunakan di farm ini` }

  await prisma.hewan.create({
    data: {
      tag,
      nama: nama || null,
      kelamin: kelamin as Kelamin,
      kategori: kategori as KategoriHewan,
      berat: isNaN(berat) ? null : berat,
      tanggalLahir,
      farmId,
      bapakId,
      indukId,
    }
  })

  redirect('/hewan')
}

export async function transferHewan(hewanId: string, toFarmId: string, alasan?: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) {
    return { error: 'Akses ditolak' }
  }
  if (hewan.farmId === toFarmId) return { error: 'Hewan sudah berada di farm tersebut' }

  // Block transfer if tag already exists in destination farm
  const tagConflict = await prisma.hewan.findUnique({
    where: { tag_farmId: { tag: hewan.tag, farmId: toFarmId } }
  })
  if (tagConflict) {
    return {
      error: `Transfer gagal: Tag "${hewan.tag}" sudah digunakan di farm tujuan. Ganti tag hewan ini terlebih dahulu sebelum melakukan transfer.`
    }
  }

  await prisma.$transaction([
    prisma.transferHewan.create({
      data: {
        hewanId,
        fromFarmId: hewan.farmId,
        toFarmId,
        alasan: alasan || null,
        tanggal: new Date(),
      }
    }),
    prisma.hewan.update({
      where: { id: hewanId },
      data: { farmId: toFarmId }
    })
  ])

  revalidatePath('/hewan')
  return { success: true }
}

export async function editHewan(hewanId: string, formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const tag = formData.get('tag') as string
  const nama = formData.get('nama') as string
  const kelamin = formData.get('kelamin') as string
  const kategori = formData.get('kategori') as string
  const status = formData.get('status') as string
  const tanggalLahir = new Date(formData.get('tanggalLahir') as string)
  const bapakId = (formData.get('bapakId') as string) || null
  const indukId = (formData.get('indukId') as string) || null

  const existing = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!existing) return { error: 'Hewan tidak ditemukan' }
  
  if (session.role !== 'SUPER_ADMIN' && existing.farmId !== session.activeFarmId) {
    return { error: 'Akses ditolak' }
  }

  // Tag uniqueness: scoped to same farm, excluding the hewan itself
  if (tag !== existing.tag) {
    const checkTag = await prisma.hewan.findUnique({
      where: { tag_farmId: { tag, farmId: existing.farmId } }
    })
    if (checkTag) return { error: `Tag "${tag}" sudah digunakan di farm ini` }
  }

  await prisma.hewan.update({
    where: { id: hewanId },
    data: {
      tag,
      nama: nama || null,
      kelamin: kelamin as Kelamin,
      kategori: kategori as KategoriHewan,
      status: status as StatusHewan,
      tanggalLahir,
      bapakId: bapakId || null,
      indukId: indukId || null,
    }
  })

  redirect(`/hewan/${hewanId}`)
}

export async function updateFotoHewan(hewanId: string, fotoUrl: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const existing = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!existing) return { error: 'Hewan tidak ditemukan' }
  
  if (session.role !== 'SUPER_ADMIN' && existing.farmId !== session.activeFarmId) {
    return { error: 'Akses ditolak' }
  }

  await prisma.hewan.update({
    where: { id: hewanId },
    data: { fotoUrl }
  })

  revalidatePath(`/hewan/${hewanId}`)
  return { success: true }
}

