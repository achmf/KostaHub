import { describe, it, expect } from 'vitest'
import { resetPasswordSchema } from '../validations/auth.schema'

describe('resetPasswordSchema', () => {
  it('accepts 6 characters', () => expect(resetPasswordSchema.safeParse({ password: '123456' }).success).toBe(true))
  it('rejects short password', () => expect(resetPasswordSchema.safeParse({ password: '12345' }).success).toBe(false))
})
