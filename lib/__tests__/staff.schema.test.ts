import { describe, it, expect } from 'vitest'
import { createStaffSchema } from '../validations/auth.schema'

describe('createStaffSchema', () => {
  const ok = { name: 'Budi', email: 'budi@example.com', password: '123456' }
  it('accepts valid input', () => expect(createStaffSchema.safeParse(ok).success).toBe(true))
  it('rejects bad email', () => expect(createStaffSchema.safeParse({ ...ok, email: 'x' }).success).toBe(false))
  it('rejects short password', () => expect(createStaffSchema.safeParse({ ...ok, password: '12345' }).success).toBe(false))
  it('rejects empty name', () => expect(createStaffSchema.safeParse({ ...ok, name: '' }).success).toBe(false))
})
