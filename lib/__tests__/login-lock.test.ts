import { describe, it, expect } from 'vitest'
import { setelahGagal, sedangTerkunci, LAMA_KUNCI_MS } from '../login-lock'

const t = new Date('2026-11-12T00:00:00Z')

describe('login-lock', () => {
  it('menambah hitungan sebelum percobaan ke-5', () => {
    expect(setelahGagal(3, t)).toEqual({ failedLogins: 4, lockedUntil: null })
  })
  it('mengunci 15 menit pada percobaan ke-5 dan mereset hitungan', () => {
    const r = setelahGagal(4, t)
    expect(r.failedLogins).toBe(0)
    expect(r.lockedUntil!.getTime()).toBe(t.getTime() + 900000)
    expect(LAMA_KUNCI_MS).toBe(900000)
  })
  it('sedangTerkunci', () => {
    expect(sedangTerkunci(new Date(t.getTime() + 1), t)).toBe(true)
    expect(sedangTerkunci(null, t)).toBe(false)
    expect(sedangTerkunci(t, t)).toBe(false)
  })
})
