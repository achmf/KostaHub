'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

type RegisterResult = { error?: string; success?: boolean }

export async function registerOwner(formData: FormData): Promise<RegisterResult> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string
  const farmNama = formData.get('farmNama') as string
  const farmAlamat = formData.get('farmAlamat') as string
  const farmLat = formData.get('farmLat') as string
  const farmLng = formData.get('farmLng') as string
  const farmDeskripsi = formData.get('farmDeskripsi') as string
  const farmSertifikat = formData.get('farmSertifikat') as File | null

  if (!name || !email || !password || !farmNama) {
    return { error: 'Nama, email, password, dan nama farm wajib diisi' }
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  let parsedLat: number | null = null
  let parsedLng: number | null = null

  if (farmLat) {
    parsedLat = parseFloat(farmLat)
    if (isNaN(parsedLat)) return { error: 'Latitude farm harus berupa angka' }
  }

  if (farmLng) {
    parsedLng = parseFloat(farmLng)
    if (isNaN(parsedLng)) return { error: 'Longitude farm harus berupa angka' }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'Email sudah terdaftar' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  let sertifikatUrl = null
  if (farmSertifikat && farmSertifikat.size > 0) {
    try {
      const bytes = await farmSertifikat.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = path.join(process.cwd(), 'public/uploads')
      await mkdir(uploadDir, { recursive: true })
      
      const ext = farmSertifikat.name.split('.').pop() || 'png'
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`
      const filePath = path.join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)
      sertifikatUrl = `/uploads/${fileName}`
    } catch (e) {
      console.error('File upload failed', e)
    }
  }

  await prisma.$transaction(async (tx) => {
    const farm = await tx.farm.create({
      data: {
        nama: farmNama,
        alamat: farmAlamat || null,
        lat: parsedLat,
        lng: parsedLng,
        deskripsi: farmDeskripsi || null,
        sertifikatUrl,
        status: 'NONAKTIF',
      },
    })

    await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'OWNER',
        phone: phone || null,
        approvalStatus: 'PENDING',
        farmId: farm.id,
      },
    })
  })

  return { success: true }
}
