'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

export type NotifikasiItem = {
  id: string
  title: string
  message: string
  tanggal: string
  isRead: boolean
  type: string
  farmId: string | null
}

const POLL_INTERVAL = 60_000 // 60 detik
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function useNotifikasi() {
  const [list, setList] = useState<NotifikasiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const prevIdsRef = useRef<Set<string>>(new Set())
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifikasi = useCallback(async (showToast = false) => {
    try {
      const res = await fetch('/api/notifikasi')
      if (!res.ok) return
      const data: NotifikasiItem[] = await res.json()

      setList(data)

      if (showToast) {
        const newItems = data.filter(
          (n) => !n.isRead && !prevIdsRef.current.has(n.id)
        )
        newItems.forEach((n) => {
          toast(n.title, {
            description: n.message,
            duration: 5000,
            action: { label: 'Lihat', onClick: () => window.location.href = '/notifikasi' },
          })
        })
      }

      prevIdsRef.current = new Set(data.map((n) => n.id))
    } catch (err) {
      console.error('[useNotifikasi] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifikasi(false)
    pollRef.current = setInterval(() => fetchNotifikasi(true), POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchNotifikasi])

  // Register Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered:', reg.scope)
        // Check if already subscribed
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setPushEnabled(true)
        })
      })
      .catch((err) => console.error('[SW] Registration failed:', err))
  }, [])

  const requestPushPermission = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Browser ini tidak mendukung Push Notification')
      return false
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      toast.error('Izin notifikasi ditolak. Aktifkan di pengaturan browser.')
      return false
    }

    try {
      const reg = await navigator.serviceWorker.ready
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as any,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })

      setPushEnabled(true)
      toast.success('Push Notification aktif! Anda akan menerima notifikasi otomatis.')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[Push] Subscribe failed:', msg)
      // Push service error sering terjadi di dev (HTTP) atau browser tertentu
      toast.warning(
        'Push Notification tidak tersedia di lingkungan ini. ' +
        'Notifikasi tetap aktif via polling setiap 60 detik.',
        { duration: 6000 }
      )
      return false
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    const res = await fetch('/api/notifikasi/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) return
    const data = await res.json()
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: data.isRead } : n))
    )
  }, [])

  const markAllRead = useCallback(async () => {
    const res = await fetch('/api/notifikasi/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    if (!res.ok) return
    setList((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success('Semua notifikasi ditandai sudah dibaca')
  }, [])

  const refetch = useCallback(() => fetchNotifikasi(false), [fetchNotifikasi])

  const unreadCount = list.filter((n) => !n.isRead).length

  return {
    list,
    loading,
    unreadCount,
    pushEnabled,
    requestPushPermission,
    markRead,
    markAllRead,
    refetch,
  }
}
