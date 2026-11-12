export const MAKS_GAGAL = 5
export const LAMA_KUNCI_MS = 15 * 60 * 1000

export function sedangTerkunci(lockedUntil: Date | null, now: Date): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime()
}

export function setelahGagal(
  failedLogins: number,
  now: Date,
): { failedLogins: number; lockedUntil: Date | null } {
  const n = failedLogins + 1
  if (n >= MAKS_GAGAL) {
    return { failedLogins: 0, lockedUntil: new Date(now.getTime() + LAMA_KUNCI_MS) }
  }
  return { failedLogins: n, lockedUntil: null }
}
