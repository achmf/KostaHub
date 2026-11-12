import { describe, it, expect } from 'vitest'
import { hewanSchema } from '../validations/hewan.schema'

const valid = { tag: 'K-01', kelamin: 'JANTAN', kategori: 'ANAKAN', tanggalLahir: '2024-01-01' }

describe('hewanSchema.berat', () => {
  it('empty string -> undefined', () => expect(hewanSchema.parse({ ...valid, berat: '' }).berat).toBeUndefined())
  it('"12.5" -> 12.5', () => expect(hewanSchema.parse({ ...valid, berat: '12.5' }).berat).toBe(12.5))
  it('negative rejected', () => expect(hewanSchema.safeParse({ ...valid, berat: '-3' }).success).toBe(false))
})

describe('hewanSchema kategori vs kelamin', () => {
  const msg = 'Kategori tidak sesuai kelamin'
  const bad = (kelamin: string, kategori: string) => hewanSchema.safeParse({ ...valid, kelamin, kategori })
  it('JANTAN + INDUKAN rejected with message', () => {
    const r = bad('JANTAN', 'INDUKAN')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe(msg)
  })
  it('JANTAN + DARA rejected', () => expect(bad('JANTAN', 'DARA').success).toBe(false))
  it('BETINA + PEJANTAN rejected', () => expect(bad('BETINA', 'PEJANTAN').success).toBe(false))
  it('BETINA + JANTAN_MUDA rejected', () => expect(bad('BETINA', 'JANTAN_MUDA').success).toBe(false))
  it('valid pairs accepted', () => {
    for (const [k, c] of [['BETINA', 'INDUKAN'], ['BETINA', 'DARA'], ['JANTAN', 'PEJANTAN'], ['JANTAN', 'JANTAN_MUDA'], ['BETINA', 'ANAKAN'], ['JANTAN', 'ANAKAN']])
      expect(bad(k, c).success).toBe(true)
  })
})
