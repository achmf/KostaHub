import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Store subscriptions in memory (single process dev) or use DB in production
// For simplicity we store per-session; push is best-effort
const subscriptions = new Map<string, PushSubscriptionJSON>()

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscription } = await req.json() as { subscription: PushSubscriptionJSON }
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const key = (session.activeFarmId as string) ?? session.id ?? 'global'
  subscriptions.set(key, subscription)

  return NextResponse.json({ success: true })
}

export function getSubscription(farmId: string | null): PushSubscriptionJSON | undefined {
  return subscriptions.get(farmId ?? 'global')
}
