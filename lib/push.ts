import webPush from 'web-push'
import { prisma } from './prisma'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:admin@kostahub.com'

let configured = false
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
    configured = true
  } catch (err) {
    // Env salah (kunci tidak valid / VAPID_EMAIL tanpa "mailto:") → push mati, fitur lain tetap jalan
    console.error('[Push] Konfigurasi VAPID tidak valid:', err)
  }
}
export const pushConfigured = configured

export type PushPayload = {
  title: string
  body: string
  url?: string
  /** Notifikasi dengan tag sama saling menggantikan di HP; beda tag = tampil terpisah. */
  tag?: string
}

type Subscription = { endpoint: string; p256dh: string; auth: string }

async function sendToSubscriptions(subs: Subscription[], payload: PushPayload) {
  const body = JSON.stringify(payload)
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webPush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 60 * 60 * 24 }
        )
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // 404/410 = langganan sudah dicabut di browser → hapus supaya tidak dicoba lagi
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } })
        } else {
          console.error('[Push] Gagal mengirim:', status ?? err)
        }
      }
    })
  )
}

/** Kirim ke semua Owner/Petugas yang tergabung di salah satu farm tersebut (satu kali per perangkat). */
export async function pushToFarms(farmIds: string[], payload: PushPayload) {
  if (!pushConfigured || farmIds.length === 0) return
  const subs = await prisma.pushSubscription.findMany({
    where: {
      user: {
        deletedAt: null,
        role: { in: ['OWNER', 'PETUGAS'] },
        farms: { some: { farmId: { in: farmIds } } },
      },
    },
    select: { endpoint: true, p256dh: true, auth: true },
  })
  await sendToSubscriptions(subs, payload)
}

export function pushToFarm(farmId: string, payload: PushPayload) {
  return pushToFarms([farmId], payload)
}
