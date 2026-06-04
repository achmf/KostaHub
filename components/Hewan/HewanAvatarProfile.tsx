'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, Loader2, UploadCloud } from 'lucide-react'
import Image from 'next/image'
import { uploadFotoHewanLocal } from '@/actions/upload'
import { updateFotoHewan } from '@/actions/hewan'

interface HewanAvatarProfileProps {
  hewanId: string
  fotoUrl: string | null
  nama?: string | null
  tag?: string
}

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
}

export function HewanAvatarProfile({ hewanId, fotoUrl, nama, tag }: HewanAvatarProfileProps) {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(fotoUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      // 1. Upload file
      const uploadRes = await uploadFotoHewanLocal(formData)
      if (uploadRes?.error) {
        setError(uploadRes.error)
        setPreview(fotoUrl) // Revert
        return
      }

      if (uploadRes?.url) {
        // 2. Update DB
        const updateRes = await updateFotoHewan(hewanId, uploadRes.url)
        if (updateRes?.error) {
          setError(updateRes.error)
          setPreview(fotoUrl)
        } else {
          setPreview(uploadRes.url) // Update to real URL
        }
      }
    })
  }

  return (
    <div className="flex flex-col items-center sm:items-start shrink-0">
      <div 
        className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-2xl transition-all duration-300 hover:shadow-3xl"
        style={{ 
          width: 140, 
          height: 140, 
          background: 'rgba(242,237,224,0.06)', 
          border: '1px dashed rgba(242,237,224,0.2)' 
        }}
        onClick={() => !isPending && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isPending}
        />

        {preview ? (
          <>
            <Image 
              src={preview} 
              alt="Foto Hewan" 
              fill 
              sizes="140px"
              unoptimized={true}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              onError={() => setPreview(null)}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
              <Camera size={24} style={{ color: palette.cream }} />
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.cream, fontWeight: 500 }}>
                Ubah Foto
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 56, color: palette.cream, lineHeight: 1 }}>
              {nama ? nama.charAt(0).toUpperCase() : tag ? tag.charAt(0).toUpperCase() : 'H'}
            </span>
            <span className="absolute bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: palette.cream, fontWeight: 500 }}>
              Tambah Foto
            </span>
          </div>
        )}

        {isPending && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Loader2 className="animate-spin mb-2" size={24} style={{ color: palette.cream }} />
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: palette.cream }}>Mengunggah…</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-3 text-center sm:text-left text-rose-300 max-w-[140px] leading-tight" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>
          {error}
        </div>
      )}
    </div>
  )
}
