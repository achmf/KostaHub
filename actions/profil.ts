'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { withAuth, encrypt } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations/auth.schema'

export type ProfileActionState = { error?: string; success?: string }

// ─── Update Profile (nama + telepon) ──────────────────────────────────────────

export const updateProfile = withAuth(async (session, _prevState: ProfileActionState, formData: FormData): Promise<ProfileActionState> => {
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, phone } = parsed.data

  try {
    await prisma.user.update({
      where: { id: session.id },
      data: { name, phone },
    })

    // Refresh JWT session agar nama di header ikut update
    const updatedSession = await encrypt({
      ...session,
      name,
    })
    const cookieStore = await cookies()
    cookieStore.set('session', updatedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return { success: 'Profil berhasil diperbarui.' }
  } catch {
    return { error: 'Gagal memperbarui profil. Coba lagi.' }
  }
})

// ─── Change Password ───────────────────────────────────────────────────────────

export const changePassword = withAuth(async (session, _prevState: ProfileActionState, formData: FormData): Promise<ProfileActionState> => {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { currentPassword, newPassword } = parsed.data

  if (currentPassword === newPassword) {
    return { error: 'Password baru tidak boleh sama dengan password lama.' }
  }

  try {
    // Ambil hash password dari DB — selalu dari server, bukan dari client
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { password: true, deletedAt: true },
    })

    if (!user || user.deletedAt) {
      return { error: 'Akun tidak ditemukan atau sudah dinonaktifkan.' }
    }

    // Verifikasi password lama
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return { error: 'Password saat ini tidak sesuai.' }
    }

    // Hash password baru dengan salt rounds 12
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: session.id },
      data: { password: hashedPassword },
    })

    return { success: 'Password berhasil diubah.' }
  } catch {
    return { error: 'Gagal mengubah password. Coba lagi.' }
  }
})
