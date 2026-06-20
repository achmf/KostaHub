'use client'

import { useActionState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Building2 } from 'lucide-react'
import { createAdditionalFarm } from '@/actions/farm'

interface AddFarmModalProps {
  onClose: () => void
}

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ochre: '#C7873E',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
}

type FormState = { error?: string; success?: boolean; pendingApproval?: boolean } | null

export default function AddFarmModal({ onClose }: AddFarmModalProps) {
  const [state, action, isPending] = useActionState<FormState, FormData>(
    async (_prevState: FormState, formData: FormData) => {
      return await createAdditionalFarm(formData)
    },
    null
  )

  useEffect(() => {
    if (state?.success) {
      // Refresh halaman untuk menampilkan farm baru yang pending
      window.location.reload()
    }
  }, [state])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,20,15,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: palette.cream, border: `1px solid ${palette.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(199,135,62,0.12)' }}
            >
              <Building2 size={16} style={{ color: palette.ochre }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: palette.ink }}>
                Tambah Farm Baru
              </h2>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                Butuh persetujuan Super Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(13,20,15,0.06)' }}
          >
            <X size={14} style={{ color: palette.ink }} />
          </button>
        </div>

        {/* Form */}
        <form action={action} className="flex flex-col gap-4">
          {[
            { name: 'nama', label: 'Nama Farm', placeholder: 'cth. Farm Omega', required: true },
            { name: 'alamat', label: 'Alamat', placeholder: 'Jl. Contoh No. 1, Kota', required: false },
            { name: 'deskripsi', label: 'Deskripsi (opsional)', placeholder: 'Deskripsi singkat farm', required: false },
          ].map((field) => (
            <div key={field.name}>
              <label
                htmlFor={`add-farm-${field.name}`}
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: 'rgba(13,20,15,0.6)' }}
              >
                {field.label}{field.required && <span style={{ color: palette.ochre }}> *</span>}
              </label>
              <input
                id={`add-farm-${field.name}`}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl outline-none"
                style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  background: '#fff',
                  border: `1.5px solid ${palette.border}`,
                  color: palette.ink,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = palette.ochre }}
                onBlur={(e) => { e.currentTarget.style.borderColor = palette.border }}
              />
            </div>
          ))}

          {state?.error && (
            <p
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', fontFamily: "'Inter',sans-serif" }}
            >
              {state.error}
            </p>
          )}

          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(199,135,62,0.08)', border: `1px solid rgba(199,135,62,0.2)` }}
          >
            <span style={{ fontSize: 14 }}>ℹ️</span>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.6)', lineHeight: 1.5 }}>
              Farm baru akan berstatus <strong>menunggu persetujuan</strong> sampai Super Admin menyetujuinya.
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm"
              style={{
                fontFamily: "'Inter',sans-serif",
                border: `1.5px solid ${palette.border}`,
                color: 'rgba(13,20,15,0.6)',
                background: 'transparent',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{
                fontFamily: "'Inter',sans-serif",
                background: isPending ? 'rgba(199,135,62,0.5)' : palette.forest,
                color: palette.cream,
                border: 'none',
              }}
            >
              {isPending ? 'Menyimpan…' : 'Ajukan Farm'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
