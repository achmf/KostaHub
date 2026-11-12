import { z } from 'zod'
import { Kelamin, KategoriHewan } from '@prisma/client'

export const hewanSchema = z.object({
  tag: z.string().min(1, { message: 'Tag wajib diisi' }),
  rfidUid: z.string().optional().nullable(),
  nama: z.string().optional(),
  kelamin: z.nativeEnum(Kelamin, { error: 'Kelamin tidak valid' }),
  kategori: z.nativeEnum(KategoriHewan, { error: 'Kategori tidak valid' }),
  berat: z.preprocess(v => (v === '' || v == null ? undefined : v), z.coerce.number().positive({ message: 'Berat harus lebih dari 0' }).optional()),
  tanggalLahir: z.coerce.date({ error: 'Tanggal lahir tidak valid' }),
  bapakId: z.string().optional(),
  indukId: z.string().optional(),
  farmId: z.string().optional(), // Dibutuhkan untuk Super Admin saat tambah
}).refine(
  d => {
    if (d.kategori === 'INDUKAN' || d.kategori === 'DARA') return d.kelamin === 'BETINA'
    if (d.kategori === 'PEJANTAN' || d.kategori === 'JANTAN_MUDA') return d.kelamin === 'JANTAN'
    return true
  },
  { message: 'Kategori tidak sesuai kelamin', path: ['kategori'] },
)
