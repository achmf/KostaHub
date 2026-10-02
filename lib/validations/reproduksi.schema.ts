import { z } from 'zod'
import { Kelamin } from '@prisma/client'

// "1,8" (koma desimal Indonesia) diterima sama dengan "1.8"; kosong = tidak diisi
const beratLahir = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : Number(v.replace(',', '.'))))
  .refine((v) => v === undefined || (Number.isFinite(v) && v > 0 && v <= 15), {
    message: 'Berat lahir harus antara 0,1 – 15 kg',
  })

export const anakSchema = z.object({
  tag: z.string().trim().min(1, { message: 'Tag anak wajib diisi' }).max(30, { message: 'Tag maksimal 30 karakter' }),
  kelamin: z.nativeEnum(Kelamin, { error: 'Pilih kelamin anak' }),
  berat: beratLahir,
})

export const hasilLahirSchema = z
  .object({
    tanggalLahir: z.coerce.date({ error: 'Tanggal lahir tidak valid' }),
    anak: z.array(anakSchema).min(1).max(3, { message: 'Maksimal 3 anak per kelahiran' }),
  })
  .refine((d) => new Set(d.anak.map((a) => a.tag.toUpperCase())).size === d.anak.length, {
    message: 'Tag tiap anak harus berbeda',
  })
