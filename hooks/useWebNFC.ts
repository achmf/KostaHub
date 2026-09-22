'use client'

import { useState, useCallback } from 'react'

export function useWebNFC() {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async (): Promise<string | null> => {
    if (!('NDEFReader' in window)) {
      setError('Web NFC tidak didukung di perangkat/browser ini. Gunakan Chrome for Android.')
      return null
    }

    try {
      setIsScanning(true)
      setError(null)
      // @ts-ignore
      const ndef = new window.NDEFReader()
      await ndef.scan()

      return new Promise((resolve, reject) => {
        const onReading = (event: any) => {
          ndef.removeEventListener('reading', onReading)
          ndef.removeEventListener('readingerror', onReadingError)
          setIsScanning(false)
          
          // The serialNumber comes as a colon-separated hex string (e.g. 04:8F:21:4A)
          // We can remove colons to make it cleaner or keep it as is. 
          // Let's keep it as is to avoid modifying raw UID data.
          const uid = event.serialNumber
          resolve(uid)
        }

        const onReadingError = () => {
          ndef.removeEventListener('reading', onReading)
          ndef.removeEventListener('readingerror', onReadingError)
          setIsScanning(false)
          const err = 'Gagal membaca tag. Silakan coba lagi.'
          setError(err)
          resolve(null) // Resolve null so app can handle it gracefully instead of uncaught promise
        }

        ndef.addEventListener('reading', onReading)
        ndef.addEventListener('readingerror', onReadingError)
      })
    } catch (err: any) {
      setIsScanning(false)
      setError(err.message || 'Terjadi kesalahan saat menginisiasi NFC.')
      return null
    }
  }, [])

  return { scan, isScanning, error }
}
