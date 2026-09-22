'use server'

import { withAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { hewanSchema } from '@/lib/validations/hewan.schema'
import { createHewanLogic, transferHewanLogic, editHewanLogic, updateFotoHewanLogic } from '@/services/hewan.service'
import { invalidateHewan } from '@/lib/cache-invalidation'

export const tambahHewan = withAuth(async (session, formData: FormData) => {

  const parsed = hewanSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const result = await createHewanLogic(parsed.data, session, formData.get('farmId') as string)
  if ('error' in result) return result

  invalidateHewan()
  redirect('/hewan')
})

export const transferHewan = withAuth(async (session, hewanId: string, toFarmId: string, alasan?: string) => {

  const result = await transferHewanLogic(hewanId, toFarmId, alasan, session)
  if ('error' in result) return result

  invalidateHewan()
  revalidatePath('/hewan')
  return { success: true }
})

export const editHewan = withAuth(async (session, hewanId: string, formData: FormData) => {

  const parsed = hewanSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const result = await editHewanLogic(hewanId, parsed.data, session)
  if ('error' in result) return result

  invalidateHewan()
  redirect(`/hewan/${hewanId}`)
})

export const updateFotoHewan = withAuth(async (session, hewanId: string, fotoUrl: string) => {

  const result = await updateFotoHewanLogic(hewanId, fotoUrl, session)
  if ('error' in result) return result

  invalidateHewan()
  revalidatePath(`/hewan/${hewanId}`)
  return { success: true }
})

