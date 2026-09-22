import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'

const secretKey = process.env.JWT_SECRET || 'secret-kostahub-farm-2026'
const key = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  id: string
  name: string
  email: string
  role: string
  activeFarmId: string | null // farm yang sedang aktif dipilih user
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload as SessionPayload
}

/**
 * Deduplicated per-request via React cache().
 * Layout + page both call getSession() but JWT is decoded only once.
 */
export const getSession = cache(async () => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch {
    return null
  }
})

/**
 * HOF wrapper untuk Server Actions agar tidak perlu menulis ulang `getSession()`
 * dan pengecekan otorisasi di setiap file action.
 */
export function withAuth<Args extends any[], Return>(
  handler: (session: SessionPayload, ...args: Args) => Promise<Return>
) {
  return async (...args: Args): Promise<Return> => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')
    return handler(session, ...args)
  }
}
