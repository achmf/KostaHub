'use client'

import { useEffect } from 'react'

// Daftarkan service worker di semua halaman: dibutuhkan untuk install PWA, push, dan halaman offline.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => console.error('[SW] Gagal mendaftar:', err))
  }, [])
  return null
}
