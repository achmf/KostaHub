'use server'

import { withAuth, withMutationAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { farmSchema, farmRegistrationSchema } from '@/lib/validations/farm.schema'
import { invalidateFarm } from '@/lib/cache-invalidation'
import { simpanFile } from '@/lib/storage'

import { createFarmLogic, createAdditionalFarmLogic, assignUserToFarmLogic, assignStaffToFarmLogic, removeUserFromFarmLogic, updateFarmLogic, deleteFarmLogic, getFarmsLogic, createFarmRegistrationLogic } from '@/services/farm.service'

export const createFarm = withMutationAuth(async (session, formData: FormData) => {
  const parsed = farmSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const result = await createFarmLogic(parsed.data, session as any)
  if ('error' in result) return result

  invalidateFarm()
  revalidatePath('/farm')
  return { success: true }
})

export const createAdditionalFarm = withMutationAuth(async (session, formData: FormData) => {
  const parsed = farmSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const result = await createAdditionalFarmLogic(parsed.data, session as any)
  if ('error' in result) return result

  invalidateFarm()
  revalidatePath('/farms')
  return { success: true, pendingApproval: true }
})

export const assignUserToFarm = withAuth(async (session, userId: string, farmId: string) => {
  const result = await assignUserToFarmLogic(userId, farmId, session as any)
  if ('error' in result) return result

  revalidatePath('/admin/users')
  return { success: true }
})

export const assignStaffToFarm = withMutationAuth(async (session, staffId: string, farmId: string) => {
  const result = await assignStaffToFarmLogic(staffId, farmId, session as any)
  if ('error' in result) return result

  revalidatePath('/staff')
  return { success: true }
})

export const removeUserFromFarm = withMutationAuth(async (session, userId: string, farmId: string) => {
  const result = await removeUserFromFarmLogic(userId, farmId, session as any)
  if ('error' in result) return result

  revalidatePath('/staff')
  return { success: true }
})

export const updateFarm = withMutationAuth(async (session, id: string, formData: FormData) => {
  const parsed = farmSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const result = await updateFarmLogic(id, parsed.data, session as any)
  if ('error' in result) return result

  invalidateFarm()
  revalidatePath('/farm')
  revalidatePath(`/farm/${id}`)
  return { success: true }
})

export const deleteFarm = withMutationAuth(async (session, id: string) => {
  const result = await deleteFarmLogic(id, session as any)
  if ('error' in result) return result

  invalidateFarm()
  revalidatePath('/farm')
  return { success: true }
})

export const getFarms = withAuth(async (session) => {
  return getFarmsLogic(session as any)
})

export const createFarmRegistration = withMutationAuth(async (session, formData: FormData) => {
  const parsed = farmRegistrationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const farmSertifikat = formData.get('farmSertifikat') as File | null

  let sertifikatUrl: string | null = null
  if (farmSertifikat && farmSertifikat.size > 0) {
    const hasil = await simpanFile(farmSertifikat, 'sertifikat', { izinkanPdf: true, maksMB: 4 })
    if ('error' in hasil) return { error: `Sertifikat: ${hasil.error}` }
    sertifikatUrl = hasil.url
  }

  const result = await createFarmRegistrationLogic(parsed.data, sertifikatUrl, session as any)
  if ('error' in result) return result

  revalidatePath('/farms')
  return { success: true, pendingApproval: true }
})
