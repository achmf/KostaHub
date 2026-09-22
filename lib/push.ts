import webPush from 'web-push'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:admin@kostahub.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
}

export type PushPayload = {
  title: string
  body: string
  icon?: string
  url?: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webPush.sendNotification(
      subscription as webPush.PushSubscription,
      JSON.stringify(payload)
    )
    return true
  } catch (err) {
    console.error('[Push] Failed to send:', err)
    return false
  }
}
