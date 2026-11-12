import { describe, it, expect } from 'vitest'
import { lewatHariIniWIB } from '../tanggal'

describe('lewatHariIniWIB', () => {
  it('hari ini WIB (03:00) -> false', () => expect(lewatHariIniWIB(new Date('2026-11-12'), new Date('2026-11-11T20:00:00Z'))).toBe(false))
  it('besok WIB -> true', () => expect(lewatHariIniWIB(new Date('2026-11-13'), new Date('2026-11-11T20:00:00Z'))).toBe(true))
  it('23:59 WIB tgl 11, tgl 12 -> true', () => expect(lewatHariIniWIB(new Date('2026-11-12'), new Date('2026-11-11T16:59:00Z'))).toBe(true))
  it('kemarin -> false', () => expect(lewatHariIniWIB(new Date('2026-11-11'), new Date('2026-11-12T05:00:00Z'))).toBe(false))
})
