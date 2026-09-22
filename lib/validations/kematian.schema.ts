import { z } from 'zod'
import { PenyebabKematian } from '@prisma/client'

export const kematianSchema = z.object({
  tanggalMati: z.coerce.date({ error: 'Tanggal kematian tidak valid' }),
  penyebab: z.nativeEnum(PenyebabKematian, { error: 'Penyebab kematian tidak valid' }),
  catatan: z.string().optional(),
})
