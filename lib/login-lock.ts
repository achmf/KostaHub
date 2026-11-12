export const MAKS_GAGAL = 5
export const LAMA_KUNCI_MS = 15 * 60 * 1000

export function sedangTerkunci(lockedUntil: Date | null, now: Date): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime()
}

// jumlahSetelahIncrement: hasil increment atomik dari DB
export function kunciSetelahGagal(jumlahSetelahIncrement: number, now: Date): Date | null {
  return jumlahSetelahIncrement >= MAKS_GAGAL ? new Date(now.getTime() + LAMA_KUNCI_MS) : null
}
