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

export function useNotifikasi() {
  const [list, setList] = useState<NotifikasiItem[]>([])
  const [loading, setLoading] = useState(true)
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
    markRead,
    markAllRead,
    refetch,
  }
}
