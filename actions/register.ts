'use server'

import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

import { registerOwnerSchema } from '@/lib/validations/auth.schema'

type RegisterResult = { error?: string }

export async function registerOwner(formData: FormData): Promise<RegisterResult> {
  const parsed = registerOwnerSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, password, phone } = parsed.data

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
