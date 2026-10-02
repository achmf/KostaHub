'use client'

import { useRouter } from 'next/navigation'
import { Nfc, X } from 'lucide-react'
import { toast } from 'sonner'
import { useWebNFC } from '@/hooks/useWebNFC'
import { cariHewanByRfid } from '@/actions/rfid'
import { palette } from '@/components/KostaUI'

// Tag yang ditulis lewat "Tulis NFC" berisi URL profil (bisa dari domain preview/lokal) → ambil path-nya saja.
const PATH_HEWAN = /^\/hewan\/[0-9a-f-]{36}$/i

function pathHewan(url: string | null) {
  if (!url) return null
  try {
    const { pathname } = new URL(url)
    return PATH_HEWAN.test(pathname) ? pathname : null
  } catch {
    return null
  }
}

/** Tombol scan tag NFC (Chrome Android) → langsung buka profil hewan. Tidak tampil di perangkat tanpa Web NFC. */
export function NfcScanButton() {
  const router = useRouter()
  const { supported, scanning, scan, cancel } = useWebNFC()
  if (!supported) return null

  const onClick = async () => {
    if (scanning) return cancel()
    try {
      const tag = await scan()
      if (!tag) return

      const path = pathHewan(tag.url)
      if (path) return router.push(path)
      if (!tag.uid) return toast.error('Tag tidak memiliki UID. Daftarkan ulang lewat profil hewan.')

      const res = await cariHewanByRfid(tag.uid)
      if ('id' in res) router.push(`/hewan/${res.id}`)
      else toast.error(res.error, { description: `UID: ${tag.uid}` })
    } catch (err) {
      toast.error((err as Error).message || 'Gagal membaca tag NFC')
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={scanning ? 'Batalkan scan NFC' : 'Scan tag NFC hewan'}
      className="cursor-pointer shrink-0 h-10 px-4 rounded-full flex items-center gap-2 transition-colors"
      style={{
        border: `1px solid ${scanning ? palette.moss : palette.border}`,
        background: scanning ? 'rgba(63,91,58,0.10)' : 'transparent',
        color: palette.ink,
        fontFamily: "'Inter',sans-serif",
        fontSize: 13,
      }}
    >
      {scanning ? <X size={15} /> : <Nfc size={15} />}
      <span className="whitespace-nowrap">{scanning ? 'Tempel tag…' : 'Scan NFC'}</span>
    </button>
  )
}
