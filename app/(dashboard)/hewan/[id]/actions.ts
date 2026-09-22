'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function saveRfidTag(hewanId: string, uid: string) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Check if tag already exists and belongs to another hewan
    const existingTag = await prisma.tagRfid.findUnique({
      where: { rfidUid: uid }
    })

    if (existingTag && existingTag.hewanId !== hewanId) {
      return { success: false, error: 'Tag RFID ini sudah terdaftar pada hewan lain.' }
    }

    if (!existingTag) {
      // Create new
      await prisma.tagRfid.create({
        data: {
          hewanId,
          rfidUid: uid,
          status: 'AKTIF'
        }
      })
    } else {
      // Just update status if needed
      await prisma.tagRfid.update({
        where: { rfidUid: uid },
        data: { status: 'AKTIF' }
      })
    }

    revalidatePath(`/hewan/${hewanId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to save RFID tag:', error)
    return { success: false, error: 'Gagal menyimpan Tag RFID' }
  }
}
