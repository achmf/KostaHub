import { describe, it, expect } from 'vitest'
import { medisSchema } from '../validations/medis.schema'

const valid = { tanggal: '2026-05-10', kategori: 'VAKSINASI', diagnosis: 'Vaksin PMK' }

describe('medisSchema', () => {
  it('valid record passes', () => expect(medisSchema.safeParse(valid).success).toBe(true))
  it('empty diagnosis rejected', () => expect(medisSchema.safeParse({ ...valid, diagnosis: '   ' }).success).toBe(false))
  it('invalid kategori rejected', () => expect(medisSchema.safeParse({ ...valid, kategori: 'NGAWUR' }).success).toBe(false))
  it('tanggalLanjut before tanggal rejected', () =>
    expect(medisSchema.safeParse({ ...valid, tanggalLanjut: '2026-05-01' }).success).toBe(false))
  it('tanggalLanjut absent or equal passes', () => {
    expect(medisSchema.safeParse({ ...valid, tanggalLanjut: undefined }).success).toBe(true)
    expect(medisSchema.safeParse({ ...valid, tanggalLanjut: '2026-05-10' }).success).toBe(true)
  })
})
