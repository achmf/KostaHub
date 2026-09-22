import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Edit, Scale, Calendar, MapPin, Activity, GitBranch, Skull } from 'lucide-react'
import Link from 'next/link'
import { Badge, KostaCard, KostaSectionLabel, KostaButton } from '@/components/KostaUI'

const LOCAL_PALETTE = {
  forest: '#1B2A1F',
  cream: '#F2EDE0',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  moss: '#3F5B3A',
  danger: '#B5443B',
}
import { RekamMedisHistory } from '@/components/Hewan/RekamMedisHistory'
import { buildSilsilahTree } from '@/lib/silsilah'
import { SilsilahTree } from '@/components/Hewan/SilsilahTree'
import { HewanAvatarProfile } from '@/components/Hewan/HewanAvatarProfile'
import { HybridTagManager } from '@/components/Hewan/HybridTagManager'
import { BatalkanKematianButton } from '@/components/Hewan/BatalkanKematianButton'

const KATEGORI_LABEL: Record<string, string> = {
  INDUKAN: 'Indukan', PEJANTAN: 'Pejantan', ANAKAN: 'Anakan',
  DARA: 'Dara', JANTAN_MUDA: 'Jantan Muda',
}

const KATEGORI_VARIANT: Record<string, 'emerald' | 'ink' | 'ochre' | 'moss' | 'amber'> = {
  INDUKAN: 'moss', PEJANTAN: 'ink', ANAKAN: 'ochre', DARA: 'emerald', JANTAN_MUDA: 'amber',
}

const PENYEBAB_LABEL: Record<string, string> = {
  PENYAKIT: 'Penyakit',
  KECELAKAAN: 'Kecelakaan',
  USIA_TUA: 'Usia Tua',
  MELAHIRKAN: 'Komplikasi Melahirkan',
  LAINNYA: 'Lainnya',
}

export default async function HewanDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getSession()
  if (!session) redirect('/login')

  const hewanId = params.id
  const hewan = await prisma.hewan.findUnique({
    where: { id: hewanId },
    include: {
      farm: true,
      beratHistory: { orderBy: { tanggal: 'desc' }, take: 5 },
      rekamMedis: { orderBy: { tanggal: 'desc' }, take: 5 },
      tagsRfid: true,
      kematian: true,
    },
  })

  if (!hewan) notFound()
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) redirect('/hewan')

  const isMati = !!hewan.kematian

  const [umurBulan, silsilahTree] = await Promise.all([
    Promise.resolve(Math.max(0, Math.floor(
      (Date.now() - hewan.tanggalLahir.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ))),
    buildSilsilahTree(hewanId),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <Link
          href="/hewan"
          className="flex items-center gap-2 min-h-10 opacity-70 hover:opacity-100 transition-all duration-300 hover:-translate-x-1"
          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
        >
          <ArrowLeft size={16} className="md:w-[14px] md:h-[14px]" /> <span>Kembali ke Populasi</span>
        </Link>
        <Link href={`/hewan/${hewan.id}/edit`}>
          <KostaButton variant="outline" className="hover:bg-black/5 px-3 md:px-4">
            <Edit size={16} className="md:w-[13px] md:h-[13px]" /> <span>Edit Data</span>
          </KostaButton>
        </Link>
      </div>

      {/* Hero card */}
      <KostaCard className="overflow-hidden mb-5">
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-16 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center" style={{ background: LOCAL_PALETTE.forest, color: LOCAL_PALETTE.cream }}>
          <HewanAvatarProfile hewanId={hewan.id} fotoUrl={hewan.fotoUrl} nama={hewan.nama} tag={hewan.tag} />

          <div className="min-w-0">
            <div
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.18em', opacity: 0.55 }}
            >
              {hewan.tag}
            </div>
            <h1
              className="mt-3"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1, letterSpacing: '-0.025em' }}
            >
              {hewan.nama || 'Tanpa Nama'}
            </h1>
            <div className="mt-5 flex gap-2 flex-wrap">
              <Badge variant={KATEGORI_VARIANT[hewan.kategori] ?? 'cream'} surface="dark">
                {KATEGORI_LABEL[hewan.kategori] ?? hewan.kategori}
              </Badge>
              {isMati
                ? <Badge variant="rose" surface="dark">Mati</Badge>
                : <Badge variant="emerald" surface="dark">Hidup</Badge>
              }
              <Badge variant="ink" surface="dark">{hewan.kelamin === 'BETINA' ? '♀ Betina' : '♂ Jantan'}</Badge>
            </div>
          </div>
        </div>

        {/* Stat cards offset into hero */}
        <div className="px-5 sm:px-8 -mt-10 pb-5 sm:pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Calendar size={12} />, l: 'TANGGAL LAHIR', v: hewan.tanggalLahir.toLocaleDateString('id-ID'), sub: `${umurBulan} bulan` },
              { icon: <Scale size={12} />, l: 'BERAT TERKINI', v: hewan.berat ? `${hewan.berat} kg` : '—', sub: 'tertimbang terakhir' },
              { icon: <MapPin size={12} />, l: 'FARM', v: hewan.farm.nama.replace('Farm ', ''), sub: 'lokasi terdaftar' },
              { icon: <Activity size={12} />, l: 'REKAM MEDIS', v: `${hewan.rekamMedis.length}`, sub: 'catatan tersimpan' },
            ].map((c) => (
              <div key={c.l} className="p-3 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-black/10 bg-white" style={{ border: `1px solid ${LOCAL_PALETTE.border}` }}>
                <div className="flex items-center gap-1.5 opacity-60" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em' }}>
                  {c.icon} {c.l}
                </div>
                <div className="mt-1.5" style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(17px, 5vw, 20px)', letterSpacing: '-0.02em' }}>{c.v}</div>
                <div className="opacity-55" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </KostaCard>

      {/* Kematian info card (only if dead) */}
      {isMati && hewan.kematian && (
        <KostaCard className="p-5 sm:p-6 mb-5" style={{ borderColor: 'rgba(181,68,59,0.25)', background: 'rgba(181,68,59,0.04)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Skull size={14} style={{ color: LOCAL_PALETTE.danger }} />
                <KostaSectionLabel>CATATAN KEMATIAN</KostaSectionLabel>
              </div>
              <div className="space-y-1.5">
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  <span className="opacity-55 mr-2">Tanggal:</span>
                  <span>{hewan.kematian.tanggalMati.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  <span className="opacity-55 mr-2">Penyebab:</span>
                  <span>{PENYEBAB_LABEL[hewan.kematian.penyebab] ?? hewan.kematian.penyebab}</span>
                </div>
                {hewan.kematian.catatan && (
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                    <span className="opacity-55 mr-2">Catatan:</span>
                    <span>{hewan.kematian.catatan}</span>
                  </div>
                )}
              </div>
            </div>
            <BatalkanKematianButton hewanId={hewan.id} hewanNama={hewan.nama || hewan.tag} />
          </div>
        </KostaCard>
      )}

      {/* Weight history */}
      {hewan.beratHistory.length > 0 && (
        <KostaCard className="p-5 sm:p-6 mb-5">
          <KostaSectionLabel>RIWAYAT PENIMBANGAN</KostaSectionLabel>
          <div className="mt-4 divide-y" style={{ borderColor: LOCAL_PALETTE.border }}>
            {hewan.beratHistory.map((h) => (
              <div key={h.id} className="py-3.5 px-3 flex items-center justify-between gap-3 hover:bg-black/5 rounded-lg -mx-3 transition-colors">
                <div className="min-w-0">
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5 }}>
                    {h.tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {h.catatan && (
                    <div className="opacity-55 mt-0.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
                      {h.catatan}
                    </div>
                  )}
                </div>
                <div className="shrink-0" style={{ fontFamily: "'Fraunces',serif", fontSize: 22, letterSpacing: '-0.02em', color: LOCAL_PALETTE.moss }}>
                  {h.berat}
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, opacity: 0.6 }}> kg</span>
                </div>
              </div>
            ))}
          </div>
        </KostaCard>
      )}

      {/* Medical records */}
      <RekamMedisHistory records={hewan.rekamMedis} />

      {/* Silsilah / Family Tree */}
      <KostaCard className="p-5 sm:p-6 mt-5">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={13} style={{ color: LOCAL_PALETTE.moss }} />
          <KostaSectionLabel>SILSILAH KETURUNAN</KostaSectionLabel>
        </div>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)', marginBottom: 20 }}>
          Pohon silsilah dihitung dari semua leluhur yang tercatat di sistem.
        </p>
        <SilsilahTree tree={silsilahTree} />
      </KostaCard>

      <HybridTagManager hewanId={hewan.id} tagStr={hewan.tag} existingTags={hewan.tagsRfid} />
    </div>
  )
}
