'use client'

import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createFarm } from '@/actions/farm'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'

interface AddFarmModalProps {
  open: boolean
  onClose: () => void
}

export default function AddFarmModal({ open, onClose }: AddFarmModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await createFarm(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Farm berhasil ditambahkan')
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
      title="Tambah Farm Baru"
      description="Farm yang ditambahkan oleh Super Admin akan langsung berstatus AKTIF."
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FormField label="Nama Farm" required>
            <Input name="nama" placeholder="Contoh: Farm Berkah" required className="h-[42px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white px-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
          </FormField>
          <FormField label="Alamat">
            <Textarea name="alamat" placeholder="Alamat lengkap farm..." className="min-h-[80px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white p-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Latitude (opsional)">
              <Input name="lat" type="number" step="any" placeholder="-6.200000" className="h-[42px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white px-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
            </FormField>
            <FormField label="Longitude (opsional)">
              <Input name="lng" type="number" step="any" placeholder="106.816666" className="h-[42px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white px-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
            </FormField>
          </div>
          <FormField label="Deskripsi">
            <Textarea name="deskripsi" placeholder="Deskripsi singkat mengenai farm..." className="min-h-[80px] w-full rounded-[10px] border border-[rgba(13,20,15,0.12)] bg-white p-3 text-[14px] outline-none transition-all focus-visible:border-[#C7873E] focus-visible:ring-4 focus-visible:ring-[rgba(199,135,62,0.12)] shadow-sm" />
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
            {loading ? 'Menyimpan...' : 'Simpan Farm'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
