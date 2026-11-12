import { describe, it, expect } from 'vitest'
import { kunciSetelahGagal, sedangTerkunci, LAMA_KUNCI_MS } from '../login-lock'

const t = new Date('2026-11-12T00:00:00Z')

describe('login-lock', () => {
  it('belum mengunci sebelum percobaan ke-5', () => {
    expect(kunciSetelahGagal(4, t)).toBeNull()
  })
  it('mengunci 15 menit pada hitungan 5 dan 6', () => {
    expect(kunciSetelahGagal(5, t)!.getTime()).toBe(t.getTime() + 900000)
    expect(kunciSetelahGagal(6, t)!.getTime()).toBe(t.getTime() + LAMA_KUNCI_MS)
  })
  it('sedangTerkunci', () => {
    expect(sedangTerkunci(new Date(t.getTime() + 1), t)).toBe(true)
    expect(sedangTerkunci(null, t)).toBe(false)
    expect(sedangTerkunci(t, t)).toBe(false)
  })
})
