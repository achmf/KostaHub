'use client'

import { tambahRekamMedis } from '@/actions/medis'
import Link from 'next/link'
import { ArrowLeft, CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { useActionState, useState } from 'react'
import { KostaButton, KostaSectionLabel, palette } from '@/components/KostaUI'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HewanSelector } from '@/components/ui/HewanSelector'
import { DatePickerField } from '@/components/ui/DatePickerField'
import { cn } from '@/lib/utils'



const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 10,
  letterSpacing: '0.15em',
  color: 'rgba(13,20,15,0.55)',
  display: 'block',
  marginBottom: 8,
}

export function TambahMedisForm({ hewan }: { hewan: { id: string; tag: string; nama: string | null }[] }) {
  const [obatKategori, setObatKategori] = useState('')
  const [hewanId, setHewanId] = useState('')
  const [butuhNotifikasi, setButuhNotifikasi] = useState(false)

  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    return await tambahRekamMedis(formData)
  }, null)

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/medis"
        className="flex items-center gap-2 mb-8 opacity-70 hover:opacity-100 transition-opacity"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}
      >
        <ArrowLeft size={14} /> Kembali ke Rekam Medis
      </Link>

      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
        <div className="px-8 pt-8 pb-6" style={{ background: palette.forest, color: palette.cream }}>
          <KostaSectionLabel>
            <span style={{ color: 'rgba(242,237,224,0.55)' }}>REKAM MEDIS · TAMBAH</span>
          </KostaSectionLabel>
          <h1
            className="mt-2"
            style={{ fontFamily: "'Fraunces',serif", fontSize: 32, letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            Tambah Rekam Medis
          </h1>
          <p className="mt-2 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            Catat kondisi kesehatan dan vaksinasi hewan.
          </p>
        </div>

        <form action={formAction} className="px-8 py-8 space-y-6">
          {(state as any)?.error && (
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(181,68,59,0.10)', color: '#B5443B', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              {(state as any).error}
            </div>
          )}

          <div>
            <label style={labelStyle}>PILIH HEWAN *</label>
            <HewanSelector 
              name="hewanId" 
              hewanList={hewan} 
              value={hewanId} 
              onChange={setHewanId} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>TANGGAL *</label>
              <DatePickerField
                name="tanggal"
                defaultValue={new Date()}
                required
                className="h-11 bg-white/60 hover:bg-white focus-visible:ring-[#3F5B3A]/40 shadow-sm"
              />
            </div>
            <div>
              <label style={labelStyle}>DOKTER / PETUGAS</label>
              <Input 
                name="dokter" 
                placeholder="Nama pemeriksa" 
                className="h-11 w-full rounded-xl bg-white/60 border-border/60 hover:bg-white focus:bg-white transition-all shadow-sm" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>KATEGORI TINDAKAN *</label>
              <Select name="kategori" required>
                <SelectTrigger className="h-11 w-full rounded-xl bg-white/60 border-border/60 hover:bg-white focus:bg-white transition-all shadow-sm">
                  <SelectValue placeholder="— Pilih Kategori —">
                    {(val: string) => {
                      const labels: Record<string, string> = {
                        VAKSINASI: 'Vaksinasi',
                        PENGOBATAN_INFEKSI: 'Pengobatan Infeksi (Antibiotik)',
                        PENGOBATAN_PARASIT: 'Pengobatan Parasit (Cacing / Kutu)',
                        PEMERIKSAAN_RUTIN: 'Pemeriksaan Rutin / Kebuntingan',
                        PERAWATAN_LUKA: 'Perawatan Luka / Cedera',
                        VITAMIN: 'Pemberian Suplemen / Vitamin',
                        PARTUS: 'Penanganan Kelahiran (Partus)',
                        POTONG_KUKU: 'Potong Kuku / Tanduk',
                        LAINNYA: 'Lainnya'
                      }
                      return val ? labels[val] : '— Pilih Kategori —'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                  <SelectItem value="VAKSINASI" label="Vaksinasi">Vaksinasi</SelectItem>
                  <SelectItem value="PENGOBATAN_INFEKSI" label="Pengobatan Infeksi (Antibiotik)">Pengobatan Infeksi (Antibiotik)</SelectItem>
                  <SelectItem value="PENGOBATAN_PARASIT" label="Pengobatan Parasit (Cacing / Kutu)">Pengobatan Parasit (Cacing / Kutu)</SelectItem>
                  <SelectItem value="PEMERIKSAAN_RUTIN" label="Pemeriksaan Rutin / Kebuntingan">Pemeriksaan Rutin / Kebuntingan</SelectItem>
                  <SelectItem value="PERAWATAN_LUKA" label="Perawatan Luka / Cedera">Perawatan Luka / Cedera</SelectItem>
                  <SelectItem value="VITAMIN" label="Pemberian Suplemen / Vitamin">Pemberian Suplemen / Vitamin</SelectItem>
                  <SelectItem value="PARTUS" label="Penanganan Kelahiran (Partus)">Penanganan Kelahiran (Partus)</SelectItem>
                  <SelectItem value="POTONG_KUKU" label="Potong Kuku / Tanduk">Potong Kuku / Tanduk</SelectItem>
                  <SelectItem value="LAINNYA" label="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label style={labelStyle}>DETAIL TINDAKAN / DIAGNOSIS *</label>
              <Input 
                required 
                name="diagnosis" 
                placeholder="cth: Vaksin PMK, Mastitis…" 
                className="h-11 w-full rounded-xl bg-white/60 border-border/60 hover:bg-white focus:bg-white transition-all shadow-sm" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>OBAT DIBERIKAN</label>
              <Select name="obat_kategori" onValueChange={(val: string | null) => setObatKategori(val ?? '')}>
                <SelectTrigger className="h-11 w-full rounded-xl bg-white/60 border-border/60 hover:bg-white focus:bg-white transition-all shadow-sm">
                  <SelectValue placeholder="— Tidak Ada / Pilih Obat —" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                  <SelectItem value="NONE">— Tidak Ada / Pilih Obat —</SelectItem>
                  <SelectItem value="Vitamin B Kompleks">Vitamin B Kompleks</SelectItem>
                  <SelectItem value="Vitamin ADE">Vitamin ADE</SelectItem>
                  <SelectItem value="Antibiotik (Oxytetracycline)">Antibiotik (Oxytetracycline)</SelectItem>
                  <SelectItem value="Antibiotik (Penicillin)">Antibiotik (Penicillin)</SelectItem>
                  <SelectItem value="Obat Cacing (Albendazole)">Obat Cacing (Albendazole)</SelectItem>
                  <SelectItem value="Obat Cacing (Ivermectin)">Obat Cacing (Ivermectin)</SelectItem>
                  <SelectItem value="Obat Kutu / Scabies">Obat Kutu / Scabies</SelectItem>
                  <SelectItem value="Anti-Radang / Analgesik">Anti-Radang / Analgesik</SelectItem>
                  <SelectItem value="Salep Luka / Antiseptik">Salep Luka / Antiseptik</SelectItem>
                  <SelectItem value="Vaksin PMK">Vaksin PMK</SelectItem>
                  <SelectItem value="Vaksin Anthrax">Vaksin Anthrax</SelectItem>
                  <SelectItem value="Kalsium (Milk Fever)">Kalsium (Milk Fever)</SelectItem>
                  <SelectItem value="LAINNYA">Lainnya (Ketik Sendiri)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {obatKategori === 'LAINNYA' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <label style={labelStyle}>NAMA OBAT (LAINNYA) *</label>
                <Input 
                  required 
                  name="obat_custom" 
                  placeholder="Ketik nama obat…" 
                  className="h-11 w-full rounded-xl bg-white/60 border-border/60 hover:bg-white focus:bg-white transition-all shadow-sm" 
                />
              </div>
            )}
          </div>

          <div className="p-5 rounded-xl space-y-4" style={{ background: 'rgba(0,0,0,0.02)', border: `1px solid ${palette.border}80` }}>
            <div className="flex items-center justify-between">
              <div>
                <label style={{ ...labelStyle, marginBottom: 4, color: palette.ink }}>PENGINGAT KONTROL MEDIS</label>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.7)' }}>
                  Aktifkan notifikasi pengingat jika hewan butuh perawatan atau vaksin lanjutan.
                </p>
              </div>
              <div>
                <input 
                  type="checkbox" 
                  name="butuhNotifikasi"
                  checked={butuhNotifikasi}
                  onChange={(e) => setButuhNotifikasi(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer" 
                  style={{ accentColor: palette.forest }}
                />
              </div>
            </div>

            {butuhNotifikasi && (
              <div className="animate-in fade-in zoom-in-95 duration-200 pt-4 border-t border-border/50">
                <label style={labelStyle}>TANGGAL KONTROL / TINDAK LANJUT *</label>
                <DatePickerField
                  name="tanggalLanjut"
                  defaultValue={new Date(new Date().setMonth(new Date().getMonth() + 6))}
                  required={butuhNotifikasi}
                  className="h-11 bg-white hover:bg-gray-50 focus-visible:ring-[#3F5B3A]/40 shadow-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>CATATAN TAMBAHAN</label>
            <Textarea 
              name="notes" 
              rows={3} 
              placeholder="Catatan kondisi…" 
              className="min-h-[100px] w-full resize-vertical rounded-xl bg-white/60 border-border/60 hover:bg-white focus:bg-white transition-all shadow-sm" 
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/50">
            <Link href="/medis">
              <KostaButton variant="outline" type="button">Batal</KostaButton>
            </Link>
            <KostaButton type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan…' : 'Simpan Rekam Medis'}
            </KostaButton>
          </div>
        </form>
      </div>
    </div>
  )
}
