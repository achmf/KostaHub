import { describe, it, expect } from 'vitest'
import { lewatHariIniWIB, hariIniWIB, awalHariWIB, awalBulanWIB, formatTanggalWIB, umurBulan } from '../tanggal'

describe('lewatHariIniWIB', () => {
  it('hari ini WIB (03:00) -> false', () => expect(lewatHariIniWIB(new Date('2026-11-12'), new Date('2026-11-11T20:00:00Z'))).toBe(false))
  it('besok WIB -> true', () => expect(lewatHariIniWIB(new Date('2026-11-13'), new Date('2026-11-11T20:00:00Z'))).toBe(true))
  it('23:59 WIB tgl 11, tgl 12 -> true', () => expect(lewatHariIniWIB(new Date('2026-11-12'), new Date('2026-11-11T16:59:00Z'))).toBe(true))
  it('kemarin -> false', () => expect(lewatHariIniWIB(new Date('2026-11-11'), new Date('2026-11-12T05:00:00Z'))).toBe(false))
})

describe('hariIniWIB', () => {
  it('23:30Z sudah tgl berikutnya di WIB', () => expect(hariIniWIB(new Date('2026-11-11T23:30:00Z'))).toBe('2026-11-12'))
})

describe('awalHariWIB', () => {
  it('00:00 WIB = 17:00Z hari sebelumnya', () =>
    expect(awalHariWIB(new Date('2026-11-12T03:00:00Z')).toISOString()).toBe('2026-11-11T17:00:00.000Z'))
})

describe('awalBulanWIB', () => {
  it('30 Nov 18:00Z sudah 1 Des WIB', () =>
    expect(awalBulanWIB(new Date('2026-11-30T18:00:00Z')).toISOString()).toBe('2026-11-30T17:00:00.000Z'))
})

describe('formatTanggalWIB', () => {
  it('memakai tanggal WIB', () => expect(formatTanggalWIB(new Date('2026-11-11T20:00:00Z'))).toBe('12 Nov 2026'))
})

describe('umurBulan', () => {
  it('31 Jan -> 1 Feb = 0', () => expect(umurBulan(new Date('2026-01-31'), new Date('2026-02-01'))).toBe(0))
  it('15 Jan -> 15 Mar = 2', () => expect(umurBulan(new Date('2026-01-15'), new Date('2026-03-15'))).toBe(2))
})
