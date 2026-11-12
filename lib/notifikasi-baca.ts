/** Array readBy baru setelah user menekan toggle: keluar kalau sudah ada, masuk kalau belum. */
export function toggleBaca(readBy: string[], userId: string): string[] {
  return readBy.includes(userId) ? readBy.filter((id) => id !== userId) : [...readBy, userId]
}
