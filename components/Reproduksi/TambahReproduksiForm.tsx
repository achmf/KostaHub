'use client'

import { tambahReproduksi, type TambahReproduksiState } from '@/actions/reproduksi'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { useActionState, useState, useCallback, useRef } from 'react'
import { KostaButton, KostaSectionLabel } from '@/components/KostaUI'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  rose: '#B5443B',
  roseBg: 'rgba(181,68,59,0.06)',
  roseBorder: 'rgba(181,68,59,0.25)',
  moss: '#3F5B3A',
  amber: '#D9A23C',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`,
  fontFamily: "'Inter',sans-serif", fontSize: 14, borderRadius: 12,
  padding: '12px 16px', width: '100%', outline: 'none', color: palette.ink,
}
const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em',
  color: 'rgba(13,20,15,0.55)', display: 'block', marginBottom: 8,
}

type HewanOption = { id: string; tag: string; nama: string | null }

type InbreedingWarning = {
  isRisk: boolean
  sharedAncestors: { id: string; tag: string; nama: string | null; kelamin: string }[]
}

export function TambahReproduksiForm({
  indukan,
  pejantan,
  isSuperAdmin = false,
}: {
  indukan: HewanOption[]
  pejantan: HewanOption[]
  isSuperAdmin?: boolean
}) {
  const [state, formAction, isPending] = useActionState(
    async (_: unknown, formData: FormData): Promise<TambahReproduksiState> => {
      return await tambahReproduksi(formData)
    },
    null
  )

  const [inbreedingWarning, setInbreedingWarning] = useState<InbreedingWarning | null>(null)
  const [isCheckingInbreeding, setIsCheckingInbreeding] = useState(false)
  const [overrideConfirmed, setOverrideConfirmed] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedIndukId = useRef<string>('')
  const selectedPejantanId = useRef<string>('')

  const checkInbreeding = useCallback(async (indukId: string, pejantanId: string) => {
    if (!indukId || !pejantanId) {
      setInbreedingWarning(null)
      return
    }

    setIsCheckingInbreeding(true)
    try {
      const res = await fetch('/api/check-inbreeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indukId, pejantanId }),
      })
      const data = await res.json()
      setInbreedingWarning(data)
      setOverrideConfirmed(false)
    } catch {
      setInbreedingWarning(null)
    } finally {
      setIsCheckingInbreeding(false)
    }
  }, [])

  const handleSelectionChange = useCallback((type: 'induk' | 'pejantan', value: string) => {
    if (type === 'induk') selectedIndukId.current = value
    else selectedPejantanId.current = value

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      checkInbreeding(selectedIndukId.current, selectedPejantanId.current)
    }, 500)
  }, [checkInbreeding])

  const warningFromServer = state?.warning ? state : null
  const sharedAncestors = warningFromServer?.sharedAncestors || inbreedingWarning?.sharedAncestors || []
  const hasRisk = inbreedingWarning?.isRisk || warningFromServer?.warning

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/reproduksi" className="flex items-center gap-2 mb-8 opacity-70 hover:opacity-100 transition-opacity"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>
        <ArrowLeft size={14} /> Kembali ke Reproduksi
      </Link>

      <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ background: palette.forest, color: palette.cream }}>
          <KostaSectionLabel>
            <span style={{ color: 'rgba(242,237,224,0.55)' }}>REPRODUKSI · CATAT</span>
          </KostaSectionLabel>
          <h1 className="mt-2" style={{ fontFamily: "'Fraunces',serif", fontSize: 32, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Catat Perkawinan
          </h1>
          <p className="mt-2 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            Sistem akan memeriksa potensi kawin sedarah secara otomatis.
          </p>
        </div>

        <form action={formAction} className="px-8 py-8 space-y-5">
          {/* Pasangan selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>INDUK BETINA ♀ *</label>
              <select
                required
                name="indukId"
                style={inputStyle}
                onChange={(e) => handleSelectionChange('induk', e.target.value)}
              >
                <option value="">— Pilih Indukan —</option>
                {indukan.map((h) => (
                  <option key={h.id} value={h.id}>{h.tag}{h.nama ? ` — ${h.nama}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>PEJANTAN ♂ *</label>
              <select
                required
                name="pejantanId"
                style={inputStyle}
                onChange={(e) => handleSelectionChange('pejantan', e.target.value)}
              >
                <option value="">— Pilih Pejantan —</option>
                {pejantan.map((h) => (
                  <option key={h.id} value={h.id}>{h.tag}{h.nama ? ` — ${h.nama}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal kawin */}
          <div>
            <label style={labelStyle}>TANGGAL KAWIN *</label>
            <input required name="tanggalKawin" type="date" defaultValue={new Date().toISOString().split('T')[0]} style={inputStyle} />
            <p className="mt-1 opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
              Estimasi lahir = tanggal kawin + 150 hari.
            </p>
          </div>

          {/* Checking indicator */}
          {isCheckingInbreeding && (
            <div className="flex items-center gap-2 py-2" style={{ color: 'rgba(13,20,15,0.5)', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              <div className="animate-spin w-4 h-4 rounded-full border-2" style={{ borderColor: 'rgba(13,20,15,0.15)', borderTopColor: palette.moss }} />
              Memeriksa silsilah…
            </div>
          )}

          {/* Inbreeding Warning Panel */}
          {hasRisk && !isCheckingInbreeding && (
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: palette.roseBg, border: `1.5px solid ${palette.roseBorder}` }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} style={{ color: palette.rose, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: palette.rose, letterSpacing: '-0.01em' }}>
                    Peringatan: Potensi Kawin Sedarah
                  </div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.7)', marginTop: 4 }}>
                    Sistem menemukan leluhur yang sama antara indukan dan pejantan yang dipilih.
                    Kawin sedarah dapat menyebabkan cacat genetik pada keturunan.
                  </div>
                </div>
              </div>

              {/* Shared ancestors list */}
              {sharedAncestors.length > 0 && (
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: palette.rose, marginBottom: 8 }}>
                    LELUHUR YANG SAMA ({sharedAncestors.length})
                  </div>
                  <div className="space-y-1.5">
                    {sharedAncestors.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ background: 'rgba(181,68,59,0.08)', border: '1px solid rgba(181,68,59,0.15)' }}
                      >
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: palette.rose }}>
                          {a.kelamin === 'JANTAN' ? '♂' : '♀'}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: palette.rose }}>
                          {a.tag}
                        </span>
                        {a.nama && (
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.65)' }}>
                            — {a.nama}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Override for Super Admin */}
              {isSuperAdmin ? (
                <div className="pt-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideConfirmed}
                      onChange={(e) => setOverrideConfirmed(e.target.checked)}
                      className="mt-0.5 flex-shrink-0"
                      style={{ accentColor: palette.rose, width: 16, height: 16 }}
                    />
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.75)', lineHeight: 1.5 }}>
                      Saya memahami risiko genetik dari kawin sedarah dan tetap ingin melanjutkan.
                      Data ini akan dicatat sebagai <strong>inbreeding override</strong>.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1" style={{ color: 'rgba(13,20,15,0.6)', fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
                  <ShieldAlert size={14} style={{ color: palette.rose }} />
                  Hanya Super Admin yang dapat melanjutkan perkawinan dengan risiko inbreeding.
                </div>
              )}
            </div>
          )}

          {/* No risk indicator */}
          {inbreedingWarning && !inbreedingWarning.isRisk && !isCheckingInbreeding && (
            <div className="flex items-center gap-2 py-2 px-4 rounded-xl" style={{ background: 'rgba(63,122,78,0.08)', border: '1px solid rgba(63,122,78,0.2)' }}>
              <CheckCircle2 size={15} style={{ color: '#3F7A4E' }} />
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#3F7A4E' }}>
                Tidak ditemukan risiko kawin sedarah.
              </span>
            </div>
          )}

          {/* Hidden forceSubmit field */}
          <input type="hidden" name="forceSubmit" value={overrideConfirmed ? 'true' : 'false'} />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/reproduksi">
              <KostaButton variant="outline" type="button">Batal</KostaButton>
            </Link>
            <KostaButton
              type="submit"
              disabled={isPending || (!!hasRisk && (!isSuperAdmin || !overrideConfirmed))}
            >
              {isPending ? 'Menyimpan…' : 'Simpan Perkawinan'}
            </KostaButton>
          </div>
        </form>
      </div>
    </div>
  )
}
