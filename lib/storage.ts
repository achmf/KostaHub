import { AwsClient } from 'aws4fetch'
import { randomUUID } from 'crypto'

// Bucket privat Neon (dideklarasikan di neon.ts). Kredensial S3 dari env AWS_* (Neon menyediakannya per branch).
const BUCKET = 'uploads'
const MB = 1024 * 1024

let client: AwsClient | null = null
function s3() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !process.env.AWS_ENDPOINT_URL_S3) {
    throw new Error('Object storage belum dikonfigurasi (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_ENDPOINT_URL_S3)')
  }
  client ??= new AwsClient({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, region: AWS_REGION, service: 's3' })
  return client
}

// Path-style URL: <endpoint>/<bucket>/<key>
const objectUrl = (key: string) => `${process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, '')}/${BUCKET}/${key}`

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to))

// Jenis file ditentukan dari isinya (magic bytes), bukan nama/tipe kiriman browser → SVG/HTML tidak bisa lolos.
const JENIS = [
  { ext: 'jpg', mime: 'image/jpeg', cocok: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', cocok: (b: Uint8Array) => ascii(b, 1, 4) === 'PNG' && b[0] === 0x89 },
  { ext: 'webp', mime: 'image/webp', cocok: (b: Uint8Array) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP' },
  { ext: 'pdf', mime: 'application/pdf', cocok: (b: Uint8Array) => ascii(b, 0, 5) === '%PDF-' },
] as const

/** Pola key yang dilayani /api/files. Foto hewan menyimpan id hewan di key → cek akses cukup lewat primary key. */
export const KEY_FOTO_HEWAN = /^hewan\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.(jpg|png|webp)$/
export const KEY_SERTIFIKAT = /^sertifikat\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/

/**
 * Simpan file ke bucket privat. Mengembalikan URL aplikasi (/api/files/...) yang aman disimpan di database.
 * prefix: 'sertifikat' atau `hewan/${hewanId}`.
 */
export async function simpanFile(
  file: File,
  prefix: string,
  opsi: { izinkanPdf: boolean; maksMB: number }
): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: 'File kosong' }
  if (file.size > opsi.maksMB * MB) return { error: `Ukuran file maksimal ${opsi.maksMB} MB` }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const jenis = JENIS.find((j) => j.cocok(bytes))
  if (!jenis || (jenis.ext === 'pdf' && !opsi.izinkanPdf)) {
    return { error: opsi.izinkanPdf ? 'File harus JPG, PNG, WEBP, atau PDF' : 'File harus gambar JPG, PNG, atau WEBP' }
  }

  const key = `${prefix}/${randomUUID()}.${jenis.ext}`
  try {
    const res = await s3().fetch(objectUrl(key), { method: 'PUT', body: bytes, headers: { 'Content-Type': jenis.mime } })
    if (!res.ok) throw new Error(`S3 PUT ${res.status}`)
  } catch (err) {
    console.error('[Storage] Gagal upload:', err)
    return { error: 'Gagal menyimpan file. Periksa koneksi lalu coba lagi.' }
  }
  return { url: `/api/files/${key}` }
}

/** URL baca sementara (presigned) untuk objek privat. */
export async function urlSementara(key: string, detik = 300): Promise<string> {
  const url = new URL(objectUrl(key))
  url.searchParams.set('X-Amz-Expires', String(detik))
  const signed = await s3().sign(url.toString(), { method: 'GET', aws: { signQuery: true } })
  return signed.url
}
