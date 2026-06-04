'use client'

import { tambahRekamMedis } from '@/actions/medis'
import Link from 'next/link'
import { ArrowLeft, CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { useActionState, useState } from 'react'
import { KostaButton, KostaSectionLabel } from '@/components/KostaUI'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
}

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
  const [openHewan, setOpenHewan] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())

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
            <input type="hidden" name="hewanId" value={hewanId} required />
            <Popover open={openHewan} onOpenChange={setOpenHewan}>
              <PopoverTrigger
                role="combobox"
                aria-expanded={openHewan}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-border/60 bg-white/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-white shadow-sm"
                style={{ fontFamily: "'Inter',sans-serif" }}
              >
                {hewanId
                  ? (hewan.find((h) => h.id === hewanId)?.tag + (hewan.find((h) => h.id === hewanId)?.nama ? ` — ${hewan.find((h) => h.id === hewanId)?.nama}` : ''))
                  : "— Cari atau Pilih Hewan —"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border shadow-lg" align="start">
                <Command>
                  <CommandInput placeholder="Cari tag atau nama hewan..." className="text-sm h-11" />
                  <CommandList>
                    <CommandEmpty>Hewan tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {hewan.map((h) => (
                        <CommandItem
                          key={h.id}
                          value={`${h.tag} ${h.nama || ''}`}
                          onSelect={() => {
                            setHewanId(h.id)
                            setOpenHewan(false)
                          }}
                          className="rounded-lg my-1 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              hewanId === h.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {h.tag}{h.nama ? ` — ${h.nama}` : ''}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>TANGGAL *</label>
              <input type="hidden" name="tanggal" value={date ? format(date, 'yyyy-MM-dd') : ''} required />
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "flex h-11 w-full items-center justify-start text-left rounded-xl border border-border/60 bg-white/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-white shadow-sm",
                    !date && "text-muted-foreground"
                  )}
                  style={{ fontFamily: "'Inter',sans-serif" }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {date ? format(date, "dd MMMM yyyy", { locale: localeID }) : <span>Pilih tanggal</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
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
                  <SelectValue placeholder="— Pilih Kategori —" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                  <SelectItem value="VAKSINASI">Vaksinasi</SelectItem>
                  <SelectItem value="PENGOBATAN_INFEKSI">Pengobatan Infeksi (Antibiotik)</SelectItem>
                  <SelectItem value="PENGOBATAN_PARASIT">Pengobatan Parasit (Cacing / Kutu)</SelectItem>
                  <SelectItem value="PEMERIKSAAN_RUTIN">Pemeriksaan Rutin / Kebuntingan</SelectItem>
                  <SelectItem value="PERAWATAN_LUKA">Perawatan Luka / Cedera</SelectItem>
                  <SelectItem value="VITAMIN">Pemberian Suplemen / Vitamin</SelectItem>
                  <SelectItem value="PARTUS">Penanganan Kelahiran (Partus)</SelectItem>
                  <SelectItem value="POTONG_KUKU">Potong Kuku / Tanduk</SelectItem>
                  <SelectItem value="LAINNYA">Lainnya</SelectItem>
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
