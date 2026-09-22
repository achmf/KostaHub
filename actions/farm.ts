'use server'

import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { type FarmStatus } from '@prisma/client'
import { farmSchema, farmRegistrationSchema } from '@/lib/validations/farm.schema'

import { createFarmLogic, createAdditionalFarmLogic, assignUserToFarmLogic, assignStaffToFarmLogic, removeUserFromFarmLogic, updateFarmLogic, deleteFarmLogic, getFarmsLogic, createFarmRegistrationLogic } from '@/services/farm.service'

export const createFarm = withAuth(async (session, formData: FormData) => {
  const parsed = farmSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const result = await createFarmLogic(parsed.data, session as any)
  if ('error' in result) return result

  revalidatePath('/farm')
  return { success: true }
})

export const createAdditionalFarm = withAuth(async (session, formData: FormData) => {
  const parsed = farmSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const result = await createAdditionalFarmLogic(parsed.data, session as any)
  if ('error' in result) return result

  revalidatePath('/farms')
  return { success: true, pendingApproval: true }
})

export const assignUserToFarm = withAuth(async (session, userId: string, farmId: string) => {
  const result = await assignUserToFarmLogic(userId, farmId, session as any)
  if ('error' in result) return result

  revalidatePath('/admin/users')
  return { success: true }
})

export const assignStaffToFarm = withAuth(async (session, staffId: string, farmId: string) => {
  const result = await assignStaffToFarmLogic(staffId, farmId, session as any)
  if ('error' in result) return result

  revalidatePath('/staff')
  return { success: true }
})

export const removeUserFromFarm = withAuth(async (session, userId: string, farmId: string) => {
  const result = await removeUserFromFarmLogic(userId, farmId, session as any)
  if ('error' in result) return result

  revalidatePath('/staff')
  return { success: true }
})

export const updateFarm = withAuth(async (session, id: string, formData: FormData) => {
  const parsed = farmSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const result = await updateFarmLogic(id, parsed.data, session as any)
  if ('error' in result) return result

  revalidatePath('/farm')
  revalidatePath(`/farm/${id}`)
  return { success: true }
})

export const deleteFarm = withAuth(async (session, id: string) => {
  const result = await deleteFarmLogic(id, session as any)
  if ('error' in result) return result

  revalidatePath('/farm')
  return { success: true }
})

export const getFarms = withAuth(async (session) => {
  return getFarmsLogic(session as any)
})

export const createFarmRegistration = withAuth(async (session, formData: FormData) => {
  const parsed = farmRegistrationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const farmSertifikat = formData.get('farmSertifikat') as File | null

  let sertifikatUrl: string | null = null
  if (farmSertifikat && farmSertifikat.size > 0) {
    try {
      const { writeFile, mkdir } = await import('fs/promises')
      const path = await import('path')
      const bytes = await farmSertifikat.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadDir = path.join(process.cwd(), 'public/uploads')
      await mkdir(uploadDir, { recursive: true })
      const ext = farmSertifikat.name.split('.').pop() || 'png'
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`
      await writeFile(path.join(uploadDir, fileName), buffer)
      sertifikatUrl = `/uploads/${fileName}`
    } catch (e) {
      console.error('File upload failed', e)
    }
  }

  const result = await createFarmRegistrationLogic(parsed.data, sertifikatUrl, session as any)
  if ('error' in result) return result

  revalidatePath('/farms')
  return { success: true, pendingApproval: true }
})
