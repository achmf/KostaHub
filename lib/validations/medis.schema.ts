import { z } from 'zod'
import { KategoriMedis } from '@prisma/client'

export const medisSchema = z.object({
  tanggal: z.coerce.date({ error: 'Tanggal tidak valid' }),
  kategori: z.nativeEnum(KategoriMedis, { error: 'Kategori tidak valid' }),
  diagnosis: z.string().trim().min(1, { message: 'Diagnosis wajib diisi' }),
  tanggalLanjut: z.coerce.date({ error: 'Tanggal lanjut tidak valid' }).optional(),
}).refine(
  d => !d.tanggalLanjut || d.tanggalLanjut >= d.tanggal,
  { message: 'Tanggal kontrol lanjutan tidak boleh sebelum tanggal pemeriksaan', path: ['tanggalLanjut'] },
)
