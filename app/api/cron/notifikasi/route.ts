import { NextRequest, NextResponse } from 'next/server'
import { generateUntukSemuaFarm } from '@/lib/notifikasi-generator'

export const maxDuration = 60

// Dipanggil Vercel Cron (lihat vercel.json). Vercel mengirim header Authorization: Bearer <CRON_SECRET>.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hasil = await generateUntukSemuaFarm()
  return NextResponse.json({ success: true, ...hasil })
}
