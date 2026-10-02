// KostaHub Service Worker — push notification + halaman offline.
// Sengaja TIDAK meng-cache halaman/API: data peternakan harus selalu segar dan tidak boleh
// terlihat oleh user lain di HP bersama setelah logout.

const CACHE = 'kostahub-v2'
const OFFLINE_URL = '/offline.html'
const ICON = '/icons/icon-192.png'
const BADGE = '/icons/badge-96.png'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, ICON])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Hapus cache versi lama (v1 menyimpan seluruh halaman yang pernah dibuka)
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
      await self.clients.claim()
    })()
  )
})

// Hanya navigasi halaman penuh: coba jaringan, jika offline tampilkan halaman offline.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse
        return preloaded || (await fetch(event.request))
      } catch {
        return (await caches.match(OFFLINE_URL)) || Response.error()
      }
    })()
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'KostaHub', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'KostaHub', {
      body: payload.body || '',
      icon: ICON,
      badge: BADGE,
      data: { url: payload.url || '/notifikasi' },
      // Tag berbeda → tiap pengingat tampil sendiri; tag sama → menggantikan yang lama
      tag: payload.tag,
      renotify: Boolean(payload.tag),
      lang: 'id',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/notifikasi', self.location.origin).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus()
          // navigate() hanya boleh untuk tab yang dikontrol SW ini; selain itu cukup fokus
          return client.navigate(url).catch(() => {})
        }
      }
      return self.clients.openWindow(url)
    })()
  )
})

// Browser kadang memperbarui langganan push; simpan yang baru ke server.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const options = event.oldSubscription && event.oldSubscription.options
      if (!options) return
      const sub = await self.registration.pushManager.subscribe(options)
      await fetch('/api/push/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), oldEndpoint: event.oldSubscription.endpoint }),
      })
    })()
  )
})
