'use client'

import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateFarm } from '@/actions/farm'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'

interface EditFarmModalProps {
  open: boolean
  onClose: () => void
  farm: {
    id: string
    nama: string
    alamat: string | null
    deskripsi: string | null
    lat: number | null
    lng: number | null
    status: string
  }
}

export default function EditFarmModal({ open, onClose, farm }: EditFarmModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await updateFarm(farm.id, formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Farm berhasil diperbarui')
        onClose()
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Farm"
      description="Perbarui informasi dan status farm."
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FormField label="Nama Farm" required>
            <Input name="nama" defaultValue={farm.nama} required className="h-[42px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white px-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
          </FormField>
          <FormField label="Alamat">
            <Textarea name="alamat" defaultValue={farm.alamat || ''} className="min-h-[80px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white p-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Latitude">
              <Input name="lat" type="number" step="any" defaultValue={farm.lat || ''} className="h-[42px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white px-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
            </FormField>
            <FormField label="Longitude">
              <Input name="lng" type="number" step="any" defaultValue={farm.lng || ''} className="h-[42px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white px-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
            </FormField>
          </div>
          <FormField label="Deskripsi">
            <Textarea name="deskripsi" defaultValue={farm.deskripsi || ''} className="min-h-[80px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white p-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
          </FormField>
          <FormField label="Status" required>
            <select
              name="status"
              defaultValue={farm.status}
              className="h-[42px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white px-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm"
              required
            >
              <option value="AKTIF">Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
          </FormField>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl transition-all hover:bg-[rgba(13,20,15,0.06)] active:translate-y-0 disabled:opacity-50"
            style={{
              color: '#0D140F',
              fontFamily: "'Inter',sans-serif",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            style={{
              background: '#1B2A1F',
              color: '#F2EDE0',
              fontFamily: "'Inter',sans-serif",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Building2 size={15} />
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
