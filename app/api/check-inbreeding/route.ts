import { NextRequest, NextResponse } from 'next/server'
import { checkInbreeding } from '@/lib/inbreeding'

export async function POST(req: NextRequest) {
  try {
    const { indukId, pejantanId } = await req.json()

    if (!indukId || !pejantanId) {
      return NextResponse.json({ error: 'indukId dan pejantanId wajib diisi' }, { status: 400 })
    }

    const result = await checkInbreeding(indukId, pejantanId)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Gagal memeriksa silsilah' }, { status: 500 })
  }
}
