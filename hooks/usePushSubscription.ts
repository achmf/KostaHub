'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

/**
 * unsupported  = browser tidak mendukung / server belum punya VAPID key
 * default      = belum pernah ditanya izin
 * denied       = izin diblokir di pengaturan browser
 * unsubscribed = izin ada, tapi push dimatikan di perangkat ini
 * subscribed   = aktif
 */
export type PushStatus = 'unsupported' | 'default' | 'denied' | 'unsubscribed' | 'subscribed'

function vapidKey(): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (VAPID_PUBLIC.length % 4)) % 4)
  const raw = window.atob((VAPID_PUBLIC + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

// Langganan dibuat dengan VAPID key lama → push dari server akan ditolak, jadi harus dibuat ulang
function keyMatches(sub: PushSubscription) {
  const current = sub.options.applicationServerKey
  if (!current) return false
  const a = new Uint8Array(current)
  const b = vapidKey()
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function saveToServer(sub: PushSubscription) {
  return fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  })
}

function isSupported() {
  return Boolean(VAPID_PUBLIC) && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>('unsupported')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isSupported()) return
    let cancelled = false
    navigator.serviceWorker.ready.then(async (reg) => {
      let sub = await reg.pushManager.getSubscription()
      if (sub && !keyMatches(sub)) {
        await sub.unsubscribe()
        sub = null
      }
      if (cancelled) return
      if (sub) {
        // Pastikan server punya langganan ini (mis. setelah database direset atau ganti user)
        saveToServer(sub).catch(() => {})
        setStatus('subscribed')
      } else {
        const p = Notification.permission
        setStatus(p === 'granted' ? 'unsubscribed' : p === 'denied' ? 'denied' : 'default')
      }
    })
    return () => { cancelled = true }
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported()) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'default')
        toast.error('Izin notifikasi tidak diberikan. Aktifkan lewat pengaturan situs di browser.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (sub && !keyMatches(sub)) {
        await sub.unsubscribe()
        sub = null
      }
      sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey() })
      const res = await saveToServer(sub)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('subscribed')
      toast.success('Push notification aktif di perangkat ini.')
    } catch (err) {
      console.warn('[Push] Gagal berlangganan:', err)
      toast.error('Gagal mengaktifkan push notification. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('unsubscribed')
      toast.success('Push notification dimatikan di perangkat ini.')
    } catch {
      toast.error('Gagal mematikan push notification.')
    } finally {
      setBusy(false)
    }
  }, [])

  return { status, busy, subscribe, unsubscribe }
}

/** Dipanggil saat logout: HP bersama tidak lagi menerima notifikasi milik user sebelumnya. */
export function forgetPushOnThisDevice() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.getRegistration().then(async (reg) => {
    const sub = await reg?.pushManager.getSubscription()
    if (!sub) return
    // keepalive: request tetap terkirim walau halaman berpindah karena logout
    fetch('/api/push/subscribe', {
      method: 'DELETE',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {})
    await sub.unsubscribe()
  }).catch(() => {})
}
