import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid' }),
  password: z.string().min(1, { message: 'Password wajib diisi' }),
})

export const registerOwnerSchema = z.object({
  name: z.string().min(3, { message: 'Nama minimal 3 karakter' }),
  email: z.string().email({ message: 'Email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
  phone: z.string().optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(3, { message: 'Nama minimal 3 karakter' }),
  phone: z.string().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Password lama wajib diisi' }),
  newPassword: z.string().min(6, { message: 'Password baru minimal 6 karakter' }),
  confirmPassword: z.string().min(6, { message: 'Konfirmasi password wajib diisi' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password baru dan konfirmasi tidak cocok',
  path: ['confirmPassword'],
})
