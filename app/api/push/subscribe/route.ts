import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Body = {
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  /** Dikirim service worker saat browser mengganti langganan (pushsubscriptionchange). */
  oldEndpoint?: string
}

// Simpan/aktifkan langganan push untuk perangkat ini atas nama user yang login.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscription, oldEndpoint } = (await req.json()) as Body
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth
  if (!endpoint?.startsWith('https://') || !p256dh || !auth) {
    return NextResponse.json({ error: 'Langganan push tidak valid' }, { status: 400 })
  }

  if (oldEndpoint && oldEndpoint !== endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: oldEndpoint, userId: session.id } })
  }

  // Perangkat yang sama dipakai user lain sebelumnya → pindahkan ke user sekarang
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, userId: session.id },
    update: { p256dh, auth, userId: session.id },
  })

  return NextResponse.json({ success: true })
}

// Matikan push untuk perangkat ini.
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = (await req.json()) as { endpoint?: string }
  if (!endpoint) return NextResponse.json({ error: 'endpoint wajib diisi' }, { status: 400 })

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.id } })
  return NextResponse.json({ success: true })
}
