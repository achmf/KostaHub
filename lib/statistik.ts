// Rata-rata berat populasi: hanya hewan hidup dengan berat terisi, satu desimal.
export function rataRataBerat(rows: { berat: number | null; mati: boolean }[]): number | null {
  const valid = rows.filter((r) => !r.mati && r.berat != null) as { berat: number; mati: boolean }[]
  if (valid.length === 0) return null
  const mean = valid.reduce((s, r) => s + r.berat, 0) / valid.length
  return Math.round(mean * 10) / 10
}
