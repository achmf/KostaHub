export const TZ = 'Asia/Jakarta'

// Input tanggal-saja ('YYYY-MM-DD') diparse sebagai UTC 00:00; bandingkan dengan hari ini menurut WIB (UTC+7, tanpa DST).
export function lewatHariIniWIB(tanggal: Date, now: Date = new Date()): boolean {
  const w = new Date(now.getTime() + 7 * 3600_000)
  const hariIni = Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate())
  return tanggal.getTime() >= hariIni + 86_400_000
}
