'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSession, encrypt } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export type ProfileActionState = { error?: string; success?: string }

// ─── Update Profile (nama + telepon) ──────────────────────────────────────────

export async function updateProfile(_prevState: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const session = await getSession()
  if (!session) return { error: 'Sesi tidak valid. Silakan login ulang.' }

  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null

  // Validasi input
  if (!name || name.length < 2) {
    return { error: 'Nama minimal 2 karakter.' }
  }
  if (name.length > 100) {
    return { error: 'Nama terlalu panjang (maksimal 100 karakter).' }
  }
  if (phone && !/^(\+62|62|0)[0-9]{8,13}$/.test(phone.replace(/\s/g, ''))) {
    return { error: 'Format nomor telepon tidak valid.' }
  }

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
}

// ─── Change Password ───────────────────────────────────────────────────────────

export async function changePassword(_prevState: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const session = await getSession()
  if (!session) return { error: 'Sesi tidak valid. Silakan login ulang.' }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validasi input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Semua field password wajib diisi.' }
  }
  if (newPassword.length < 8) {
    return { error: 'Password baru minimal 8 karakter.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Konfirmasi password tidak cocok.' }
  }
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
}
