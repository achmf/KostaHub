import { describe, it, expect } from 'vitest'
import { hewanSchema } from '../validations/hewan.schema'

const valid = { tag: 'K-01', kelamin: 'JANTAN', kategori: 'ANAKAN', tanggalLahir: '2024-01-01' }

describe('hewanSchema.berat', () => {
  it('empty string -> undefined', () => expect(hewanSchema.parse({ ...valid, berat: '' }).berat).toBeUndefined())
  it('"12.5" -> 12.5', () => expect(hewanSchema.parse({ ...valid, berat: '12.5' }).berat).toBe(12.5))
  it('negative rejected', () => expect(hewanSchema.safeParse({ ...valid, berat: '-3' }).success).toBe(false))
})
