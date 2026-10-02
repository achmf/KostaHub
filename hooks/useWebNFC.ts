'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Web NFC hanya ada di Chrome Android (HTTPS). Tipe-nya belum ada di lib DOM TypeScript.
type NdefRecord = { recordType: string; data?: DataView }
type NdefReadingEvent = Event & { serialNumber: string; message: { records: NdefRecord[] } }
declare class NDEFReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>
}

export type NfcReading = {
  /** UID chip, mis. "04:8f:21:4a" (bisa kosong untuk sebagian tag). */
  uid: string
  /** URL yang ditulis lewat tombol "Tulis NFC" di profil hewan, jika ada. */
  url: string | null
}

function urlDariRecord(records: NdefRecord[]): string | null {
  const rec = records.find((r) => (r.recordType === 'url' || r.recordType === 'absolute-url') && r.data)
  return rec?.data ? new TextDecoder().decode(rec.data) : null
}

export function useWebNFC() {
  const [supported, setSupported] = useState(false)
  const [scanning, setScanning] = useState(false)
  const ctrlRef = useRef<AbortController | null>(null)

  // Dicek setelah mount supaya HTML server & client sama (hindari hydration mismatch)
  useEffect(() => {
    setSupported('NDEFReader' in window)
    return () => ctrlRef.current?.abort()
  }, [])

  const cancel = useCallback(() => ctrlRef.current?.abort(), [])

  /** Menunggu satu tag ditempel. null = dibatalkan. Melempar Error berbahasa Indonesia jika gagal. */
  const scan = useCallback(async (): Promise<NfcReading | null> => {
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    setScanning(true)
    try {
      const reader = new NDEFReader()
      await reader.scan({ signal: ctrl.signal })
      return await new Promise<NfcReading | null>((resolve, reject) => {
        ctrl.signal.addEventListener('abort', () => resolve(null))
        reader.addEventListener('reading', (e) => {
          const ev = e as NdefReadingEvent
          resolve({ uid: ev.serialNumber ?? '', url: urlDariRecord(ev.message?.records ?? []) })
          ctrl.abort() // berhenti memindai setelah satu tag terbaca
        })
        reader.addEventListener('readingerror', () =>
          reject(new Error('Tag tidak terbaca. Tempelkan lagi ke bagian belakang HP dan tahan sebentar.'))
        )
      })
    } catch (err) {
      const name = (err as Error).name
      if (name === 'AbortError') return null
      if (name === 'NotAllowedError') throw new Error('Izin NFC ditolak. Izinkan NFC untuk situs ini di pengaturan Chrome.')
      if (name === 'NotReadableError') throw new Error('NFC tidak bisa dipakai. Pastikan NFC di HP sudah dinyalakan.')
      throw err
    } finally {
      if (ctrlRef.current === ctrl) {
        ctrlRef.current = null
        setScanning(false)
      }
    }
  }, [])

  return { supported, scanning, scan, cancel }
}
