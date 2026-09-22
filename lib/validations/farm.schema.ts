import { z } from 'zod'

export const farmSchema = z.object({
  nama: z.string().min(3, { message: 'Nama farm minimal 3 karakter' }),
  alamat: z.string().optional(),
  lat: z.coerce.number().optional().or(z.literal('')),
  lng: z.coerce.number().optional().or(z.literal('')),
  deskripsi: z.string().optional(),
  status: z.string().optional(),
  geojson: z.string().optional(),
})

export const farmRegistrationSchema = z.object({
  farmNama: z.string().min(3, { message: 'Nama farm minimal 3 karakter' }),
  farmAlamat: z.string().optional(),
  farmLat: z.coerce.number().optional().or(z.literal('')),
  farmLng: z.coerce.number().optional().or(z.literal('')),
  farmDeskripsi: z.string().optional(),
  // farmSertifikat is a File object, zod can validate instance of File but we'll handle it manually for simplicity or use z.any()
})
