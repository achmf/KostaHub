// Berat terbaru = tanggal paling baru; tanggal sama -> baris terakhir di array.
export function pilihBeratTerbaru(rows: { tanggal: Date; berat: number }[]): number | null {
  let best: { tanggal: Date; berat: number } | null = null
  for (const r of rows) if (!best || r.tanggal.getTime() >= best.tanggal.getTime()) best = r
  return best ? best.berat : null
}
