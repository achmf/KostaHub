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

const CACHE_NAME = 'kostahub-offline-v1';

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        const cacheCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cacheCopy);
        });
        return networkResponse;
      }).catch(() => {
        // network failure, return cached if any
      });
      return cachedResponse || fetchPromise;
    })
  );
})
