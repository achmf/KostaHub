/**
 * Perkecil foto di browser sebelum upload (maks 1280px, JPEG ~80%).
 * Foto HP 3–8 MB jadi ~200–400 KB: cepat di sinyal lemah dan di bawah batas body Server Action.
 * Jika browser tidak bisa membaca formatnya (mis. HEIC), file dikirim apa adanya.
 */
export async function kompresGambar(file: File, maksSisi = 1280, kualitas = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const skala = Math.min(1, maksSisi / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * skala)
    canvas.height = Math.round(bmp.height * skala)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', kualitas))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}
