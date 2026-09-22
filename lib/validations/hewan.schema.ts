import { z } from 'zod'
import { Kelamin, KategoriHewan } from '@prisma/client'

export const hewanSchema = z.object({
  tag: z.string().min(1, { message: 'Tag wajib diisi' }),
  rfidUid: z.string().optional().nullable(),
  nama: z.string().optional(),
  kelamin: z.nativeEnum(Kelamin, { error: 'Kelamin tidak valid' }),
  kategori: z.nativeEnum(KategoriHewan, { error: 'Kategori tidak valid' }),
  berat: z.coerce.number().optional().or(z.literal('')),
  tanggalLahir: z.coerce.date({ error: 'Tanggal lahir tidak valid' }),
  bapakId: z.string().optional(),
  indukId: z.string().optional(),
  farmId: z.string().optional(), // Dibutuhkan untuk Super Admin saat tambah
})
