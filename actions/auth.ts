'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sedangTerkunci, kunciSetelahGagal } from '@/lib/login-lock'

const DUMMY_HASH = bcrypt.hashSync('x', 10)

async function setSessionCookie(payload: Parameters<typeof encrypt>[0]) {
  const session = await encrypt(payload)
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
}

import { loginSchema } from '@/lib/validations/auth.schema'

export async function login(_prevState: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  
  if (!parsed.success) {
    // Return first validation error for compatibility with existing UI
    return { error: parsed.error.issues[0].message }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  const now = new Date()

  // Kunci dicek sebelum bcrypt agar akun terkunci tidak membocorkan benar/salahnya password
  if (user && !user.deletedAt && sedangTerkunci(user.lockedUntil, now)) {
    // Pesan kunci membuka bahwa akun ada setelah 5 kali gagal; trade-off yang diterima
    return { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }
  }

  // Selalu jalankan bcrypt (dummy bila user tidak ada/dihapus) agar waktu respons seragam
  const isValid = await bcrypt.compare(password, user && !user.deletedAt ? user.password : DUMMY_HASH)
  if (!user || user.deletedAt || !isValid) {
    if (user && !user.deletedAt) {
      // Increment atomik di DB agar tebakan paralel tetap terhitung
      const { failedLogins } = await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: { increment: 1 } },
        select: { failedLogins: true },
      })
      const lockedUntil = kunciSetelahGagal(failedLogins, now)
      if (lockedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLogins: 0, lockedUntil },
        })
      }
    }
    return { error: 'Email atau password salah' }
  }

  if (user.failedLogins !== 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null },
    })
  }


  // Super Admin & Dinas — langsung ke /admin
  if (user.role === 'SUPER_ADMIN' || user.role === 'DINAS') {
    await setSessionCookie({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      activeFarmId: null,
    })
    redirect('/admin')
  }

  // Owner / Petugas / Dokter — cek farm yang mereka miliki
  const userFarms = await prisma.userFarm.findMany({
    where: { userId: user.id },
    include: { farm: { select: { id: true, status: true } } },
  })

  // Belum punya farm sama sekali → arahkan ke pendaftaran farm
  if (userFarms.length === 0) {
    await setSessionCookie({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      activeFarmId: null,
    })
    redirect('/farms/new')
  }

  // Cek farm yang sudah AKTIF
  const activeFarms = userFarms.filter((uf) => uf.farm.status === 'AKTIF')

  // Tepat 1 farm AKTIF → langsung masuk dashboard
  if (activeFarms.length === 1) {
    await setSessionCookie({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      activeFarmId: activeFarms[0].farm.id,
    })
    redirect('/')
  }

  // Semua farm NONAKTIF (pending/ditolak) ATAU lebih dari 1 farm aktif
  // → selalu ke /farms agar user bisa melihat status farm & melakukan revisi
  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    activeFarmId: null,
  })
  redirect('/farms')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}
