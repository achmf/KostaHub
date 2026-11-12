import type { Kelamin } from '@prisma/client'

export type OrangTua = { id: string; kelamin: Kelamin; farmId: string; tanggalLahir: Date }

/** Mengembalikan pesan error pertama yang ditemukan, atau null kalau orang tua valid. */
export function cekOrangTua(args: {
  anak: { id?: string; farmId: string; tanggalLahir: Date }
  bapak?: OrangTua | null
  induk?: OrangTua | null
  leluhurBapak?: Set<string>
  leluhurInduk?: Set<string>
}): string | null {
  const { anak, bapak, induk, leluhurBapak, leluhurInduk } = args
  const ortu = [bapak, induk].filter((o): o is OrangTua => !!o)

  if (anak.id && ortu.some((o) => o.id === anak.id)) return 'Hewan tidak bisa menjadi orang tuanya sendiri'
  if (bapak && bapak.kelamin !== 'JANTAN') return 'Bapak harus jantan'
  if (induk && induk.kelamin !== 'BETINA') return 'Induk harus betina'
  if (ortu.some((o) => o.farmId !== anak.farmId)) return 'Orang tua harus dari farm yang sama'
  if (ortu.some((o) => o.tanggalLahir >= anak.tanggalLahir)) return 'Orang tua harus lahir lebih dulu'
  if (anak.id && (leluhurBapak?.has(anak.id) || leluhurInduk?.has(anak.id))) {
    return 'Silsilah melingkar: hewan ini leluhur dari orang tua yang dipilih'
  }
  return null
}
