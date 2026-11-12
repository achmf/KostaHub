/** Leluhur bersama dalam sekian generasi dianggap berisiko kawin sedarah. */
export const BATAS_GENERASI = 4

/**
 * Peta id leluhur -> depth (1 = orang tua) sudah dipotong di BATAS_GENERASI oleh query,
 * jadi fungsi ini mempercayai isi peta. Irisan key, ditambah garis lurus
 * (pejantan leluhur induk, atau induk leluhur pejantan).
 */
export function leluhurBersama(
  a: Map<string, number>,
  b: Map<string, number>,
  aId: string,
  bId: string
): string[] {
  const hasil = [...a.keys()].filter((id) => b.has(id))
  if (a.has(bId)) hasil.push(bId)
  if (b.has(aId)) hasil.push(aId)
  return hasil
}
