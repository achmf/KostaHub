import { describe, expect, it } from 'vitest'
import { resolveSession } from '../session-guard'
import type { SessionPayload } from '../auth'

const base: SessionPayload = { id: 'u1', name: 'A', email: 'a@x.id', role: 'OWNER', activeFarmId: 'f1' }
const live = { deletedAt: null, role: 'OWNER' as const, membership: { farmStatus: 'AKTIF' as const } }

describe('resolveSession', () => {
  it('menolak user yang sudah dihapus', () => {
    expect(resolveSession(base, { ...live, deletedAt: new Date() })).toBeNull()
  })
  it('menolak user yang tidak ada di DB', () => {
    expect(resolveSession(base, null)).toBeNull()
  })
  it('role diambil dari DB', () => {
    expect(resolveSession(base, { ...live, role: 'PETUGAS' })?.role).toBe('PETUGAS')
  })
  it('PETUGAS tanpa membership kehilangan activeFarmId', () => {
    expect(resolveSession(base, { ...live, role: 'PETUGAS', membership: null })?.activeFarmId).toBeNull()
  })
  it('farm NONAKTIF mengosongkan activeFarmId', () => {
    expect(resolveSession(base, { ...live, membership: { farmStatus: 'NONAKTIF' } })?.activeFarmId).toBeNull()
  })
  it('SUPER_ADMIN tanpa membership tetap memakai activeFarmId payload', () => {
    expect(resolveSession(base, { ...live, role: 'SUPER_ADMIN', membership: null })?.activeFarmId).toBe('f1')
  })
})
