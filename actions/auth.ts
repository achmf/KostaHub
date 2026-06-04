'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.deletedAt) {
    return { error: 'Kredensial tidak valid atau akun dinonaktifkan' }
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return { error: 'Kredensial tidak valid' }
  }

  if (user.approvalStatus === 'PENDING') {
    redirect('/status')
  }

  const sessionData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    farmId: user.farmId ?? null,
  }

  const session = await encrypt(sessionData)
  
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}
