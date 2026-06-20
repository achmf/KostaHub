// KostaHub Service Worker — Push Notification Handler

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'KostaHub', body: event.data.text(), url: '/notifikasi' }
  }

  const title = payload.title ?? 'KostaHub'
  const options = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/next.svg',
    badge: '/next.svg',
    data: { url: payload.url ?? '/notifikasi' },
    actions: [
      { action: 'open', title: 'Lihat' },
      { action: 'dismiss', title: 'Tutup' },
    ],
    tag: 'kostahub-notif',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url ?? '/notifikasi'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      return clients.openWindow(url)
    })
  )
})
