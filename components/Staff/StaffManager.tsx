'use client'

import { useState, useTransition } from 'react'
import { createStaff, deleteStaff } from '@/actions/staff'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, User, Mail, Lock, Phone, X, Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const palette = {
  cream: '#F2EDE0',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.10)',
  forest: '#1B2A1F',
}

const ROLE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  PETUGAS: { label: 'Petugas', bg: 'rgba(63,91,58,0.12)', color: '#3F5B3A' },
  DOKTER: { label: 'Dokter', bg: 'rgba(59,130,181,0.12)', color: '#3B82B5' },
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

  async function handleCreate(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await createStaff(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setShowForm(false)
      }
    })
  }

  function handleDelete(staffId: string, staffName: string) {
    if (!confirm(`Hapus staff "${staffName}"?`)) return
    startTransition(async () => {
      await deleteStaff(staffId)
    })
  }

  return (
    <div>
      {/* Add button */}
      {isOwner && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="cursor-pointer flex items-center gap-2 px-5 py-3 rounded-full mb-6 transition-all"
          style={{
            background: showForm ? 'rgba(13,20,15,0.06)' : palette.ink,
            color: showForm ? palette.ink : palette.cream,
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
            border: `1px solid ${showForm ? palette.border : palette.ink}`,
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Batal' : 'Tambah Staff'}
        </button>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
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
                      <SelectValue placeholder="— Pilih Role —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PETUGAS">Petugas</SelectItem>
                      <SelectItem value="DOKTER">Dokter</SelectItem>
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
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="cursor-pointer px-6 py-3 rounded-full"
                style={{
                  background: isPending ? 'rgba(13,20,15,0.5)' : palette.ink,
                  color: palette.cream,
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                }}
              >
                {isPending ? 'Menyimpan…' : 'Simpan Staff'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff list */}
      {staff.length === 0 ? (
        <div
          className="rounded-2xl"
          style={{ background: '#fff', border: `1px solid ${palette.border}` }}
        >
          <EmptyState
            icon={Users}
            title="Belum ada staff"
            description="Tambahkan petugas atau dokter untuk membantu mengelola farm."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => {
            const roleInfo = ROLE_LABELS[s.role] ?? { label: s.role, bg: 'rgba(0,0,0,0.05)', color: palette.ink }
            return (
              <div
                key={s.id}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                style={{ background: '#fff', border: `1px solid ${palette.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: palette.ochre, color: palette.ink, fontFamily: "'Fraunces',serif", fontSize: 15 }}
                >
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: roleInfo.bg, color: roleInfo.color, fontSize: 10, fontWeight: 500 }}
                    >
                      {roleInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                    <span className="flex items-center gap-1"><Mail size={10} />{s.email}</span>
                    {s.phone && <span className="flex items-center gap-1"><Phone size={10} />{s.phone}</span>}
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={isPending}
                    className="cursor-pointer p-2 rounded-lg transition-all hover:bg-red-50"
                    style={{ color: 'rgba(181,68,59,0.5)' }}
                    title="Hapus staff"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
