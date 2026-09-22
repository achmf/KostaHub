'use client'

import { useState, useTransition } from 'react'
import { Undo2 } from 'lucide-react'
import { KostaButton, palette } from '@/components/KostaUI'
import { batalkanKematian } from '@/actions/kematian'

interface Props {
  hewanId: string
  hewanNama: string
}

export function BatalkanKematianButton({ hewanId, hewanNama }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleBatalkan = () => {
    startTransition(async () => {
      setError(null)
      const result = await batalkanKematian(hewanId)
      if (result && 'error' in result) {
        setError(result.error ?? 'Terjadi kesalahan')
      }
    })
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-2 items-end shrink-0">
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.6)', textAlign: 'right', maxWidth: 180 }}>
          Batalkan pencatatan kematian {hewanNama}?
        </p>
        {error && (
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#B5443B' }}>{error}</p>
        )}
        <div className="flex gap-2">
          <KostaButton variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending} className="text-xs py-1.5 px-3">
            Batal
          </KostaButton>
          <KostaButton onClick={handleBatalkan} disabled={isPending} className="text-xs py-1.5 px-3"
            style={{ background: palette.moss, color: palette.cream }}>
            {isPending ? 'Membatalkan…' : 'Ya, Batalkan'}
          </KostaButton>
        </div>
      </div>
    )
  }

  return (
    <KostaButton
      variant="outline"
      onClick={() => setShowConfirm(true)}
      className="shrink-0 text-xs gap-1.5"
      style={{ borderColor: 'rgba(181,68,59,0.3)', color: '#B5443B' }}
    >
      <Undo2 size={12} />
      Batalkan
    </KostaButton>
  )
}
