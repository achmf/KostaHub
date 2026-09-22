'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { KostaCard, KostaSectionLabel, KostaButton, palette } from '@/components/KostaUI'
import { Download, Link as LinkIcon, Radio, Smartphone, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { saveRfidTag } from '@/app/(dashboard)/hewan/[id]/actions'

export function HybridTagManager({ hewanId, tagStr, existingTags }: { hewanId: string, tagStr: string, existingTags: any[] }) {
  const [url, setUrl] = useState('')
  const [nfcSupported, setNfcSupported] = useState(false)
  const [isWritingNfc, setIsWritingNfc] = useState(false)
  const [uidInput, setUidInput] = useState('')
  const [isSavingUid, setIsSavingUid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUrl(window.location.href)
    if ('NDEFReader' in window) {
      setNfcSupported(true)
    }
  }, [])

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `QR_${tagStr}.png`
        downloadLink.href = `${pngFile}`
        downloadLink.click()
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const copyUrl = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback untuk HTTP lokal (bukan HTTPS)
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'absolute'
        textArea.style.left = '-999999px'
        document.body.prepend(textArea)
        textArea.select()
        
        try {
          document.execCommand('copy')
        } catch (error) {
          throw new Error('Fallback copy failed')
        } finally {
          textArea.remove()
        }
      }
      toast.success('URL berhasil disalin')
    } catch (e) {
      toast.error('Gagal menyalin URL')
    }
  }

  const writeNfc = async () => {
    if (!('NDEFReader' in window)) {
      toast.error('Browser ini tidak mendukung Web NFC. Gunakan Chrome di Android.')
      return
    }
    
    try {
      setIsWritingNfc(true)
      // @ts-ignore
      const ndef = new NDEFReader()
      await ndef.write({
        records: [{ recordType: 'url', data: url }]
      })
      toast.success('Berhasil menulis URL ke tag NFC!')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menulis ke tag NFC. Pastikan tag didekatkan ke HP.')
    } finally {
      setIsWritingNfc(false)
    }
  }

  const handleUidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uidInput.trim()) return
    
    setIsSavingUid(true)
    const res = await saveRfidTag(hewanId, uidInput.trim())
    setIsSavingUid(false)
    
    if (res.success) {
      toast.success('UID Tag berhasil disimpan')
      setUidInput('')
    } else {
      toast.error(res.error || 'Gagal menyimpan UID')
    }
  }

  return (
    <KostaCard className="p-5 sm:p-6 mt-5">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={14} style={{ color: palette.moss }} />
        <KostaSectionLabel>MANAJEMEN TAG HIBRIDA (NFC & QR)</KostaSectionLabel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-2">
        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border border-dashed" style={{ borderColor: palette.border }}>
          <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
            {url ? (
              <QRCodeSVG
                id="qr-code-svg"
                value={url}
                size={160}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div className="w-[160px] h-[160px] bg-gray-100 animate-pulse rounded-lg" />
            )}
          </div>
          <KostaButton variant="outline" onClick={downloadQR} className="w-full justify-center">
            <Download size={14} /> Download QR Code
          </KostaButton>
          <p className="mt-3 text-center opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>
            Cetak QR Code ini dan pasang pada tag hewan sebagai cadangan.
          </p>
        </div>

        {/* NFC Section */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-medium" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>
              <Smartphone size={14} /> Program NFC Tag
            </div>
            <p className="opacity-70 mb-3" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
              Tulis URL halaman ini ke Tag NFC agar saat di-scan dengan HP, langsung membuka profil ini.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <KostaButton variant="outline" onClick={copyUrl} className="flex-1 justify-center">
                <LinkIcon size={14} /> Copy URL
              </KostaButton>
              {nfcSupported && (
                <KostaButton variant="primary" onClick={writeNfc} disabled={isWritingNfc} className="flex-1 justify-center bg-blue-600 border-none text-white hover:bg-blue-700">
                  <Radio size={14} /> {isWritingNfc ? 'Mendekatkan...' : 'Tulis NFC'}
                </KostaButton>
              )}
            </div>
          </div>

          <div className="h-px w-full my-1" style={{ background: palette.border }} />

          {/* Scanner Input */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-medium" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>
              <QrCode size={14} /> Daftar Scanner Fisik
            </div>
            <p className="opacity-70 mb-3" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
              Jika menggunakan RFID Stick Reader, klik kolom di bawah lalu tembakkan scanner ke tag.
            </p>
            <form onSubmit={handleUidSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                placeholder="Scan / Ketik UID RFID..."
                aria-label="UID RFID"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg outline-none"
                style={{ 
                  border: `1px solid ${palette.borderStrong}`,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 13
                }}
              />
              <KostaButton type="submit" variant="primary" disabled={isSavingUid || !uidInput.trim()}>
                Simpan
              </KostaButton>
            </form>
            
            {existingTags && existingTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {existingTags.map(t => (
                  <div key={t.id} className="px-2 py-1 rounded bg-gray-100 text-gray-600 break-all" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
                    {t.rfidUid}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </KostaCard>
  )
}
