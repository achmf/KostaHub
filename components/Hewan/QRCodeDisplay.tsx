'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'
import { Download } from 'lucide-react'
import { KostaButton } from '@/components/KostaUI'

export function QRCodeDisplay({ hewanId, tag }: { hewanId: string; tag: string }) {
  const qrRef = useRef<SVGSVGElement>(null)

  const handleDownload = () => {
    if (!qrRef.current) return
    
    // Create a canvas to draw the SVG on, so we can export to PNG
    const svgData = new XMLSerializer().serializeToString(qrRef.current)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Add padding and background
      canvas.width = img.width + 40
      canvas.height = img.height + 60
      
      if (ctx) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 20, 20)
        
        // Add tag text below
        ctx.font = 'bold 16px "JetBrains Mono", monospace'
        ctx.fillStyle = '#0D140F'
        ctx.textAlign = 'center'
        ctx.fillText(tag, canvas.width / 2, canvas.height - 15)
      }
      
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `QR_${tag}.png`
      downloadLink.href = `${pngFile}`
      downloadLink.click()
    }
    
    // We must parse the SVG to base64 for the Image object
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // Use the production URL base
  const url = `https://kostahub.com/hewan/${hewanId}`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-xl shadow-sm border border-black/10">
        <QRCodeSVG 
          id={`qr-${hewanId}`}
          value={url}
          size={120}
          level="H"
          includeMargin={false}
          ref={qrRef}
        />
      </div>
      <KostaButton variant="outline" size="sm" onClick={handleDownload} className="w-full text-xs hover:bg-black/5">
        <Download size={12} className="mr-1.5" /> Download QR
      </KostaButton>
    </div>
  )
}
