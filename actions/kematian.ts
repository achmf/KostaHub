'use server'

import { withAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { kematianSchema } from '@/lib/validations/kematian.schema'
import { catatKematianLogic, batalkanKematianLogic } from '@/services/kematian.service'
import { invalidateHewan } from '@/lib/cache-invalidation'

export const catatKematian = withAuth(async (session, hewanId: string, formData: FormData) => {
  const parsed = kematianSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const result = await catatKematianLogic(hewanId, parsed.data, session)
  if ('error' in result) return result

  invalidateHewan()
  revalidatePath(`/hewan/${hewanId}`)
  revalidatePath('/hewan')
  return { success: true }
})

export const batalkanKematian = withAuth(async (session, hewanId: string) => {
  const result = await batalkanKematianLogic(hewanId, session)
  if ('error' in result) return result

  invalidateHewan()
  revalidatePath(`/hewan/${hewanId}`)
  revalidatePath('/hewan')
  return { success: true }
})
