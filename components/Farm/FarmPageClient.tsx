'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, MapPin, Users, MoreHorizontal, X } from 'lucide-react'
import { createFarm, deleteFarm } from '@/actions/farm'
import { KostaPageHeader, KostaCard, KostaButton, Badge, KostaSectionLabel, palette } from '@/components/KostaUI'
import { GoatMark } from '@/components/GoatMark'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'

interface Farm {
  id: string
  nama: string
  alamat: string | null
  lat: number | null
  lng: number | null
  deskripsi: string | null
  status: string
  createdAt: Date
  _count: { hewan: number; members: number }
}

export default function FarmPageClient({ farms: initialFarms }: { farms: Farm[] }) {
  const [farms, setFarms] = useState(initialFarms)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const PER_PAGE = 12
  const { paged: currentFarms, page, totalPages, onPrev, onNext } = usePagination(farms, PER_PAGE)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')
    const result = await createFarm(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowModal(false)
      window.location.reload()
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteFarm(id)
    if (result?.error) {
      setError(result.error)
      setDeleteConfirm(null)
    } else {
      setFarms(farms.filter((f) => f.id !== id))
      setDeleteConfirm(null)
    }
  }

  return (
    <div>
      <KostaPageHeader
        title="Semua Lokasi, Satu Organisasi"
        description="Atur lokasi farm, koordinat GPS, dan data operasional setiap cabang."
        action={
          <KostaButton onClick={() => setShowModal(true)}>
            <Plus size={13} /> Tambah Farm
          </KostaButton>
        }
      />

      {error && (
        <div
          className="mb-5 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(181,68,59,0.1)', color: '#B5443B', fontFamily: "'Inter',sans-serif", fontSize: 13 }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {currentFarms.map((farm, i) => {
          const accent = i === 0 || i === 3
          return (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl overflow-hidden relative group"
              style={{
                background: accent ? palette.ink : '#fff',
                color: accent ? palette.cream : palette.ink,
                border: accent ? 'none' : `1px solid ${palette.border}`,
              }}
            >
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <KostaSectionLabel>
                      <span style={{ color: accent ? 'rgba(242,237,224,0.55)' : undefined }}>
                        {farm.id.toUpperCase().slice(0, 8)}
                      </span>
                    </KostaSectionLabel>
                    <div
                      className="mt-2"
                      style={{ fontFamily: "'Fraunces',serif", fontSize: 28, letterSpacing: '-0.025em' }}
                    >
                      {farm.nama}
                    </div>
                  </div>
                  <button
                    className="cursor-pointer p-2 rounded-full opacity-60 hover:opacity-100"
                    onClick={() => setDeleteConfirm(farm.id === deleteConfirm ? null : farm.id)}
                  >
                    {deleteConfirm === farm.id ? <X size={14} /> : <MoreHorizontal size={14} />}
                  </button>
                </div>
                {farm.alamat && (
                  <div
                    className="mt-2 flex items-center gap-1.5 opacity-70"
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}
                  >
                    <MapPin size={11} /> {farm.alamat}
                  </div>
                )}
                {farm.lat && (
                  <div
                    className="mt-1 opacity-50"
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}
                  >
                    {farm.lat.toFixed(4)}, {farm.lng?.toFixed(4)}
                  </div>
                )}
              </div>

              <div className="px-6 grid grid-cols-3 gap-3 pb-6">
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 30, letterSpacing: '-0.025em' }}>
                    {farm._count.hewan}
                  </div>
                  <div className="opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>Hewan</div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Fraunces',serif",
                      fontSize: 30,
                      letterSpacing: '-0.025em',
                      color: accent ? palette.ochreSoft : palette.ochre,
                    }}
                  >
                    {farm._count.members}
                  </div>
                  <div className="opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>Pengguna</div>
                </div>
              </div>

              {deleteConfirm === farm.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="px-6 pb-4 flex gap-2"
                  style={{ borderTop: `1px solid ${accent ? 'rgba(242,237,224,0.12)' : palette.border}` }}
                >
                  <button
                    onClick={() => handleDelete(farm.id)}
                    className="cursor-pointer mt-3 flex-1 py-2 rounded-full"
                    style={{
                      background: '#B5443B',
                      color: palette.cream,
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12,
                    }}
                  >
                    Hapus Farm
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="cursor-pointer mt-3 px-4 py-2 rounded-full"
                    style={{ border: `1px solid ${accent ? 'rgba(242,237,224,0.25)' : palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 12 }}
                  >
                    Batal
                  </button>
                </motion.div>
              )}

              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderTop: accent ? '1px solid rgba(242,237,224,0.12)' : `1px solid ${palette.border}` }}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={farm.status === 'AKTIF' ? 'emerald' : 'default'} surface={accent ? 'dark' : 'light'}>{farm.status}</Badge>
                  <span
                    className="flex items-center gap-1 opacity-60"
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5 }}
                  >
                    <Users size={11} /> {farm._count.members} pengguna
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: [0, 3, 0, -3, 0] }}
                  transition={{ duration: 6 + i, repeat: Infinity }}
                  style={{ opacity: 0.2 }}
                >
                  <GoatMark className="w-7 h-7" />
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {farms.length > 0 && (
        <div className="mt-6">
          <PaginationControl
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            totalItems={farms.length}
            perPage={PER_PAGE}
          />
        </div>
      )}

      {/* Add Farm Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(13,20,15,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: '#fff' }}
          >
            <div className="px-7 py-6" style={{ background: palette.forest, color: palette.cream }}>
              <KostaSectionLabel>
                <span style={{ color: 'rgba(242,237,224,0.55)' }}>SUPER ADMIN</span>
              </KostaSectionLabel>
              <div className="mt-2" style={{ fontFamily: "'Fraunces',serif", fontSize: 28, letterSpacing: '-0.025em' }}>
                Tambah Farm Baru
              </div>
            </div>
            <form onSubmit={handleCreate} className="px-7 py-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(181,68,59,0.1)', color: '#B5443B', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  {error}
                </div>
              )}
              {[
                { name: 'nama', label: 'NAMA FARM', placeholder: 'cth: Koni Farm 3', required: true },
                { name: 'alamat', label: 'ALAMAT', placeholder: 'Jl. Peternakan No.1…' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}>
                    {f.label}
                  </label>
                  <input
                    name={f.name}
                    required={f.required}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, outline: 'none' }}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'lat', label: 'LATITUDE', placeholder: '-6.9175' },
                  { name: 'lng', label: 'LONGITUDE', placeholder: '107.6191' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}>
                      {f.label}
                    </label>
                    <input
                      name={f.name}
                      type="number"
                      step="any"
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <KostaButton variant="ghost" type="button" onClick={() => setShowModal(false)}>
                  Batal
                </KostaButton>
                <KostaButton type="submit" disabled={pending}>
                  {pending ? 'Menyimpan…' : 'Simpan Farm'}
                </KostaButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
