'use server'

import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

type RegisterResult = { error?: string }

export async function registerOwner(formData: FormData): Promise<RegisterResult> {
  const name     = (formData.get('name') as string)?.trim()
  const email    = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const phone    = (formData.get('phone') as string)?.trim()

  if (!name || !email || !password) {
    return { error: 'Nama, email, dan password wajib diisi' }
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'Email sudah terdaftar' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'OWNER',
      phone: phone || null,
      // Akun langsung aktif — yang butuh approval adalah FARM, bukan akun
      approvalStatus: 'APPROVED',
    },
  })

  // Auto-login setelah registrasi
  const session = await encrypt({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    activeFarmId: null,
  })

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  // Arahkan ke halaman pendaftaran farm pertama
  redirect('/farms/new')
}
