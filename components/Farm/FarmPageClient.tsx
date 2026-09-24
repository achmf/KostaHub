'use client'

import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Plus, MapPin, Users, Trash2, X } from 'lucide-react'
import { createFarm, deleteFarm } from '@/actions/farm'
import { KostaPageHeader, KostaCard, KostaButton, Badge, KostaSectionLabel, palette } from '@/components/KostaUI'
import { GoatMark } from '@/components/GoatMark'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'
import { useConfirm } from '@/components/ConfirmProvider'
import { useToast } from '@/components/ToastProvider'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/Layout/SearchBar'
import { FilterSheet } from '@/components/Layout/FilterSheet'

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
  
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.toLowerCase() || ''
  const filterStatus = searchParams.get('status') || 'ALL'

  const { confirm: showConfirm } = useConfirm()
  const { showToast } = useToast()

  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const matchSearch = !q || f.nama.toLowerCase().includes(q) || (f.alamat?.toLowerCase().includes(q) ?? false)
      const matchStatus = filterStatus === 'ALL' || f.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [farms, q, filterStatus])

  const PER_PAGE = 12
  const { paged: currentFarms, page, totalPages, onPrev, onNext } = usePagination(filteredFarms, PER_PAGE)

  // Kunci scroll halaman & tutup dengan Escape selama modal terbuka
  useEffect(() => {
    if (!showModal) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowModal(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [showModal])

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

  async function handleDelete(farm: Farm) {
    const ok = await showConfirm({
      title: 'Hapus Farm',
      message: `Hapus farm "${farm.nama}"? Semua data hewan dan petugas di farm ini akan ikut terhapus.`,
      variant: 'danger',
      confirmText: 'Hapus',
    })
    if (!ok) return

    const result = await deleteFarm(farm.id)
    if (result?.error) {
      showToast({ title: 'Gagal Menghapus', message: result.error, type: 'error' })
    } else {
      setFarms(farms.filter((f) => f.id !== farm.id))
      showToast({ title: 'Berhasil', message: `Farm ${farm.nama} telah dihapus.`, type: 'success' })
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

      <div className="mb-5 flex flex-row items-center justify-between gap-3 sm:gap-4">
        <SearchBar placeholder="Cari nama farm atau alamat..." />
        <FilterSheet 
          filters={[
            {
              paramName: 'status',
              title: 'Status Farm',
              options: [
                { value: 'ALL', label: 'Semua Status' },
                { value: 'AKTIF', label: 'Aktif' },
                { value: 'NONAKTIF', label: 'Non-aktif' },
              ]
            }
          ]} 
        />
      </div>

      {filteredFarms.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.muted }}>Tidak ada farm yang sesuai.</p>
        </div>
      ) : (
      <div className="grid grid-cols-12 gap-4">
        {currentFarms.map((farm, i) => {
          const accent = i === 0 || i === 3
          return (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl overflow-hidden relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out"
              style={{
                background: accent ? palette.ink : '#fff',
                color: accent ? palette.cream : palette.ink,
                border: accent ? 'none' : `1px solid ${palette.border}`,
              }}
            >
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <KostaSectionLabel>
                      <span style={{ color: accent ? 'rgba(242,237,224,0.55)' : undefined }}>
                        {farm.id.toUpperCase().slice(0, 8)}
                      </span>
                    </KostaSectionLabel>
                    <div
                      className="mt-2 wrap-anywhere"
                      style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(22px, 6vw, 28px)', letterSpacing: '-0.025em' }}
                    >
                      {farm.nama}
                    </div>
                  </div>
                  <button
                    className="cursor-pointer w-10 h-10 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-colors hover:bg-red-50 hover:text-red-500"
                    onClick={() => handleDelete(farm)}
                    aria-label={`Hapus farm ${farm.nama}`}
                    title="Hapus farm"
                  >
                    <Trash2 size={14} />
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

              <div className="px-6 grid grid-cols-2 sm:grid-cols-3 gap-3 pb-6">
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
      )}

      {filteredFarms.length > 0 && (
        <div className="mt-6">
          <PaginationControl
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            totalItems={filteredFarms.length}
            perPage={PER_PAGE}
          />
        </div>
      )}

      {/* Add Farm Modal */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain p-3 sm:p-6"
          style={{ background: 'rgba(13,20,15,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="m-auto w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: '#fff' }}
          >
            <div className="px-5 py-5 sm:px-7 sm:py-6" style={{ background: palette.forest, color: palette.cream }}>
              <KostaSectionLabel>
                <span style={{ color: 'rgba(242,237,224,0.55)' }}>SUPER ADMIN</span>
              </KostaSectionLabel>
              <div className="mt-2" style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(22px, 6vw, 28px)', letterSpacing: '-0.025em' }}>
                Tambah Farm Baru
              </div>
            </div>
            <form onSubmit={handleCreate} className="px-5 py-5 sm:px-7 sm:py-6 space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <KostaButton variant="ghost" type="button" onClick={() => setShowModal(false)} className="w-full sm:w-auto justify-center">
                  Batal
                </KostaButton>
                <KostaButton type="submit" disabled={pending} className="w-full sm:w-auto justify-center">
                  {pending ? 'Menyimpan…' : 'Simpan Farm'}
                </KostaButton>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  )
}
