import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

// Kunci cadangan hanya untuk development lokal. Di production (termasuk Preview Vercel) wajib JWT_SECRET,
// kalau tidak siapa pun bisa menandatangani sesi palsu dengan kunci cadangan yang ada di kode ini.
function getKey() {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET belum di-set di environment ini')
  }
  return new TextEncoder().encode(secret || 'secret-kostahub-farm-2026')
}

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
    .sign(getKey())
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  const { payload } = await jwtVerify(input, getKey(), {
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
 * Sesi untuk halaman dashboard farm. Layout dan page dirender paralel, jadi page harus
 * redirect sendiri sebelum query — kalau tidak, query jalan dengan farmId null dan error di log.
 */
export const getFarmSession = cache(async () => {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.activeFarmId) {
    redirect(session.role === 'SUPER_ADMIN' || session.role === 'DINAS' ? '/admin' : '/farms')
  }
  return session as SessionPayload & { activeFarmId: string }
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

/**
 * Seperti withAuth, tapi juga memblokir role DINAS.
 * Gunakan untuk semua server action yang bersifat mutasi (create/update/delete)
 * di dashboard owner — DINAS hanya boleh membaca, tidak boleh mengubah data.
 */
export function withMutationAuth<Args extends any[], Return>(
  handler: (session: SessionPayload, ...args: Args) => Promise<Return>
) {
  return async (...args: Args): Promise<Return | { error: string }> => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')
    if (session.role === 'DINAS') return { error: 'Akses ditolak: DINAS hanya dapat melihat data.' } as { error: string }
    return handler(session, ...args)
  }
}
