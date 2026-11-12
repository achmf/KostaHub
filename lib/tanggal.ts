export const TZ = 'Asia/Jakarta'

// Input tanggal-saja ('YYYY-MM-DD') diparse sebagai UTC 00:00; bandingkan dengan hari ini menurut WIB (UTC+7, tanpa DST).
export function lewatHariIniWIB(tanggal: Date, now: Date = new Date()): boolean {
  const w = new Date(now.getTime() + 7 * 3600_000)
  const hariIni = Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate())
  return tanggal.getTime() >= hariIni + 86_400_000
}

const WIB_MS = 7 * 3600_000

// 'YYYY-MM-DD' menurut WIB
export function hariIniWIB(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now)
}

// Instant 00:00 WIB hari ini (= 17:00Z hari sebelumnya)
export function awalHariWIB(now: Date = new Date()): Date {
  const w = new Date(now.getTime() + WIB_MS)
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()) - WIB_MS)
}

// Instant 00:00 WIB tanggal 1 bulan ini
export function awalBulanWIB(now: Date = new Date()): Date {
  const w = new Date(now.getTime() + WIB_MS)
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), 1) - WIB_MS)
}

export function formatTanggalWIB(d: Date): string {
  return d.toLocaleDateString('id-ID', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' })
}

// Bulan kalender penuh antara dua tanggal (menurut WIB), minimal 0
export function umurBulan(lahir: Date, sampai: Date): number {
  const a = new Date(lahir.getTime() + WIB_MS)
  const b = new Date(sampai.getTime() + WIB_MS)
  let bulan = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth()
  if (b.getUTCDate() < a.getUTCDate()) bulan--
  return Math.max(0, bulan)
}
