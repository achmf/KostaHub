import { describe, it, expect } from 'vitest'
import { pilihBeratTerbaru } from '../berat'

describe('pilihBeratTerbaru', () => {
  it('picks the latest dated weighing', () =>
    expect(pilihBeratTerbaru([{ tanggal: new Date('2026-11-10'), berat: 35 }, { tanggal: new Date('2026-10-01'), berat: 30 }])).toBe(35))
  it('empty -> null', () => expect(pilihBeratTerbaru([])).toBeNull())
  it('same date -> last row in array', () =>
    expect(pilihBeratTerbaru([{ tanggal: new Date('2026-11-10'), berat: 35 }, { tanggal: new Date('2026-11-10'), berat: 36 }])).toBe(36))
})
