'use client'

import { useState, useTransition } from 'react'
import { createStaff, deleteStaff } from '@/actions/staff'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, User, Mail, Lock, Phone, X, ChevronRight } from 'lucide-react'
import { KostaButton, KostaEmptyState, palette } from '@/components/KostaUI'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/Layout/SearchBar'
import { FilterSheet } from '@/components/Layout/FilterSheet'
import { useConfirm } from '@/components/ConfirmProvider'
import { useToast } from '@/components/ToastProvider'



const ROLE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  PETUGAS: { label: 'Petugas', bg: 'rgba(63,91,58,0.12)', color: '#3F5B3A' },
}

type StaffItem = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  createdAt: Date
}

export default function StaffManager({ staff, isOwner }: { staff: StaffItem[]; isOwner: boolean }) {
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { confirm: showConfirm } = useConfirm()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.toLowerCase() || ''
  const roleFilter = searchParams.get('role') || 'ALL'

  const filteredStaff = staff.filter(s => {
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone && s.phone.includes(q))
    const matchRole = roleFilter === 'ALL' || s.role === roleFilter
    return matchQ && matchRole
  })

  const PER_PAGE = 10
  const { paged, page, totalPages, onPrev, onNext } = usePagination(filteredStaff, PER_PAGE)

  async function handleCreate(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await createStaff(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setShowForm(false)
        showToast({ title: 'Berhasil', message: 'Staff baru telah ditambahkan.', type: 'success' })
      }
    })
  }

  async function handleDelete(staffId: string, staffName: string) {
    const ok = await showConfirm({
      title: 'Hapus Staff',
      message: `Apakah Anda yakin ingin menghapus staff "${staffName}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: 'danger',
      confirmText: 'Hapus',
    })
    if (!ok) return

    startTransition(async () => {
      const result = await deleteStaff(staffId)
      if (result?.error) {
        showToast({ title: 'Gagal Menghapus', message: result.error, type: 'error' })
      } else {
        showToast({ title: 'Berhasil', message: `Staff ${staffName} telah dihapus.`, type: 'success' })
      }
    })
  }

  return (
    <div>
      {/* Add button */}
      {isOwner && (
        <KostaButton
          onClick={() => setShowForm(!showForm)}
          className="mb-6"
          variant={showForm ? 'outline' : 'primary'}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Batal' : 'Tambah Staff'}
        </KostaButton>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
        <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden mb-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
            <form
              action={handleCreate}
              className="p-6 rounded-2xl space-y-4"
              style={{ background: '#fff', border: `1px solid ${palette.border}` }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  color: 'rgba(13,20,15,0.4)',
                }}
              >
                TAMBAH STAFF BARU
              </div>

              {error && (
                <div
                  className="px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(181,68,59,0.10)',
                    border: '1px solid rgba(181,68,59,0.25)',
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                    color: '#B5443B',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}>
                    <User size={12} style={{ opacity: 0.6 }} />NAMA <span style={{ color: '#B5443B' }}>*</span>
                  </label>
                  <input
                    name="name"
                    required
                    autoComplete="off"
                    placeholder="Nama staff"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}>
                    <Mail size={12} style={{ opacity: 0.6 }} />EMAIL <span style={{ color: '#B5443B' }}>*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="email@staff.com"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}>
                    <Lock size={12} style={{ opacity: 0.6 }} />PASSWORD <span style={{ color: '#B5443B' }}>*</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Min 6 karakter"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}>
                    ROLE <span style={{ color: '#B5443B' }}>*</span>
                  </label>
                  <Select name="role" required defaultValue="PETUGAS">
                    <SelectTrigger className="h-11 w-full rounded-xl bg-white/60 border-border/60 hover:bg-white transition-all shadow-sm">
                      <SelectValue placeholder="— Pilih Role —">
                        {(val: string) => {
                          const labels: Record<string, string> = {
                            PETUGAS: 'Petugas',
                          }
                          return val ? labels[val] : '— Pilih Role —'
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PETUGAS" label="Petugas">Petugas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}>
                  <Phone size={12} style={{ opacity: 0.6 }} />NO. TELEPON
                </label>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="off"
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, outline: 'none' }}
                />
              </div>

              <KostaButton
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto justify-center"
              >
                {isPending ? 'Menyimpan…' : 'Simpan Staff'}
              </KostaButton>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar & Filter */}
      <div className="mb-5 flex flex-row items-center justify-between gap-3 sm:gap-4">
        <SearchBar placeholder="Cari nama, email, atau telepon..." />
        <FilterSheet 
          filters={[
            {
              paramName: 'role',
              title: 'Role Staff',
              options: [
                { value: 'ALL', label: 'Semua Role' },
                { value: 'PETUGAS', label: 'Petugas' },
                { value: 'OWNER', label: 'Owner' }
              ]
            }
          ]} 
        />
      </div>

      {/* Staff list */}
      {filteredStaff.length === 0 ? (
        <div
          className="rounded-2xl"
          style={{ background: '#fff', border: `1px solid ${palette.border}` }}
        >
          <KostaEmptyState
            title="Belum ada staff"
            hint="Tambahkan petugas atau dokter untuk membantu mengelola farm."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map((s) => {
            const roleInfo = ROLE_LABELS[s.role] ?? { label: s.role, bg: 'rgba(0,0,0,0.05)', color: palette.ink }
            return (
              <div
                key={s.id}
                onClick={() => router.push(`/staff/${s.id}`)}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-2xl group hover:bg-gray-50/50 transition-colors cursor-pointer"
                style={{ background: '#fff', border: `1px solid ${palette.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: palette.ochre, color: palette.ink, fontFamily: "'Fraunces',serif", fontSize: 15 }}
                >
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 wrap-anywhere" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: roleInfo.bg, color: roleInfo.color, fontSize: 10, fontWeight: 500 }}
                    >
                      {roleInfo.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                    <span className="flex items-center gap-1 min-w-0"><Mail size={10} className="shrink-0" /><span className="truncate">{s.email}</span></span>
                    {s.phone && <span className="flex items-center gap-1"><Phone size={10} />{s.phone}</span>}
                  </div>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1 sm:gap-2 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(s.id, s.name)
                      }}
                      disabled={isPending}
                      className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-all hover:bg-red-50"
                      style={{ color: 'rgba(181,68,59,0.5)' }}
                      title="Hapus staff"
                      aria-label={`Hapus staff ${s.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                    <div
                      className="p-2 rounded-lg transition-all hover:bg-gray-100"
                      style={{ color: 'rgba(13,20,15,0.5)' }}
                      title="Lihat Profil"
                    >
                      <ChevronRight size={16} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filteredStaff.length > 0 && (
            <PaginationControl
              page={page}
              totalPages={totalPages}
              onPrev={onPrev}
              onNext={onNext}
              totalItems={filteredStaff.length}
              perPage={PER_PAGE}
            />
          )}
        </div>
      )}
    </div>
  )
}
