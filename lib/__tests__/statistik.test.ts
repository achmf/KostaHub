import { describe, it, expect } from 'vitest'
import { rataRataBerat } from '../statistik'

describe('rataRataBerat', () => {
  it('null bila tidak ada baris valid', () => {
    expect(rataRataBerat([])).toBeNull()
    expect(rataRataBerat([{ berat: null, mati: false }, { berat: 40, mati: true }])).toBeNull()
  })
  it('abaikan mati dan null, bulatkan satu desimal', () => {
    expect(rataRataBerat([
      { berat: 10, mati: false },
      { berat: 11, mati: false },
      { berat: 12, mati: false },
      { berat: null, mati: false },
      { berat: 99, mati: true },
    ])).toBe(11)
    expect(rataRataBerat([{ berat: 10, mati: false }, { berat: 10.1, mati: false }, { berat: 10.1, mati: false }])).toBe(10.1)
  })
})
