import type { FarmStatus, Role } from '@prisma/client'
import type { SessionPayload } from './auth'

export type DbUserSnapshot = {
  deletedAt: Date | null
  role: Role
  membership: { farmStatus: FarmStatus } | null // keanggotaan di payload.activeFarmId
} | null

/** Menyelaraskan isi JWT dengan kondisi user terbaru di DB. Murni, tanpa akses DB. */
export function resolveSession(payload: SessionPayload, db: DbUserSnapshot): SessionPayload | null {
  if (!db || db.deletedAt) return null

  let activeFarmId = payload.activeFarmId
  if (activeFarmId && db.role !== 'SUPER_ADMIN') {
    const noMembership = !db.membership && db.role !== 'DINAS'
    const inactive = !!db.membership && db.membership.farmStatus !== 'AKTIF'
    if (noMembership || inactive) activeFarmId = null
  }
  return { ...payload, role: db.role, activeFarmId }
}
