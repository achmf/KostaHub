'use server'

import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function uploadFotoHewanLocal(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const file = formData.get('file') as File | null
  if (!file) {
    return { error: 'Tidak ada file yang dipilih' }
  }

  // Validate type
  if (!file.type.startsWith('image/')) {
    return { error: 'File harus berupa gambar (JPG/PNG/WEBP)' }
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Ukuran gambar maksimal 5MB' }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${randomUUID()}.${ext}`
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'hewan')
    await mkdir(uploadDir, { recursive: true })

    const path = join(uploadDir, fileName)
    await writeFile(path, buffer)

    return { url: `/uploads/hewan/${fileName}` }
  } catch (error) {
    console.error('Upload Error:', error)
    return { error: 'Gagal mengunggah gambar' }
  }
}
