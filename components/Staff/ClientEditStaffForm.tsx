'use client'

import { useState, useTransition } from 'react'
import { updateStaff } from '@/actions/staff'
import { KostaButton, palette } from '@/components/KostaUI'
import { User, Phone, Lock } from 'lucide-react'

export default function ClientEditStaffForm({ staff }: { staff: any }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleUpdate(formData: FormData) {
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const result = await updateStaff(staff.id, formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form action={handleUpdate} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm border border-green-100">
          Profil berhasil diperbarui.
        </div>
      )}

      <div>
        <label className="flex items-center gap-1.5 mb-2 text-xs font-mono tracking-widest text-gray-500">
          <User size={12} />NAMA <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={staff.name}
          className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border text-sm outline-none"
          style={{ borderColor: palette.border }}
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 mb-2 text-xs font-mono tracking-widest text-gray-500">
          <Phone size={12} />NO. TELEPON
        </label>
        <input
          name="phone"
          defaultValue={staff.phone || ''}
          className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border text-sm outline-none"
          style={{ borderColor: palette.border }}
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 mb-2 text-xs font-mono tracking-widest text-gray-500">
          <Lock size={12} />PASSWORD BARU
        </label>
        <input
          name="password"
          type="password"
          placeholder="Isi jika ingin mengubah password (min. 6 karakter)"
          className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border text-sm outline-none"
          style={{ borderColor: palette.border }}
        />
      </div>

      <div className="pt-2">
        <KostaButton type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
        </KostaButton>
      </div>
    </form>
  )
}
