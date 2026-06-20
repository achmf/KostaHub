import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Edit, Scale, Calendar, MapPin, Activity, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { Badge, KostaCard, KostaSectionLabel } from '@/components/KostaUI'
import { RekamMedisHistory } from '@/components/Hewan/RekamMedisHistory'
import { buildSilsilahTree } from '@/lib/silsilah'
import { SilsilahTree } from '@/components/Hewan/SilsilahTree'
import { HewanAvatarProfile } from '@/components/Hewan/HewanAvatarProfile'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  ochre: '#C7873E',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  emerald: '#3F7A4E',
}

const KATEGORI_LABEL: Record<string, string> = {
  INDUKAN: 'Indukan', PEJANTAN: 'Pejantan', ANAKAN: 'Anakan',
  DARA: 'Dara', JANTAN_MUDA: 'Jantan Muda',
}

const KATEGORI_VARIANT: Record<string, 'emerald' | 'ink' | 'ochre' | 'moss' | 'amber'> = {
  INDUKAN: 'moss', PEJANTAN: 'ink', ANAKAN: 'ochre', DARA: 'emerald', JANTAN_MUDA: 'amber',
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
    },
  })

  if (!hewan) notFound()
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) redirect('/hewan')

  const [umurBulan, silsilahTree] = await Promise.all([
    Promise.resolve(Math.max(0, Math.floor(
      (Date.now() - hewan.tanggalLahir.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ))),
    buildSilsilahTree(hewanId),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/hewan"
          className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
        >
          <ArrowLeft size={14} /> Kembali ke Populasi
        </Link>
        <Link href={`/hewan/${hewan.id}/edit`}>
          <button
            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full transition-opacity hover:opacity-90"
            style={{
              background: palette.ink,
              color: palette.cream,
              fontFamily: "'Inter',sans-serif",
              fontSize: 13,
            }}
          >
            <Edit size={13} /> Edit Data
          </button>
        </Link>
      </div>

      {/* Hero card */}
      <KostaCard className="overflow-hidden mb-5">
        <div className="px-8 pt-8 pb-16 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center" style={{ background: palette.forest, color: palette.cream }}>
          <HewanAvatarProfile hewanId={hewan.id} fotoUrl={hewan.fotoUrl} nama={hewan.nama} tag={hewan.tag} />
          
          <div>
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
              {hewan.status === 'AKTIF' && <Badge variant="emerald" surface="dark">Aktif</Badge>}
              {hewan.status === 'MATI' && <Badge variant="rose" surface="dark">Mati</Badge>}
              {hewan.status === 'TERJUAL' && <Badge variant="cream" surface="dark">Terjual</Badge>}
              <Badge variant="ink" surface="dark">{hewan.kelamin === 'BETINA' ? '♀ Betina' : '♂ Jantan'}</Badge>
            </div>
          </div>
        </div>

        {/* Stat cards offset into hero */}
        <div className="px-8 -mt-10 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Calendar size={12} />, l: 'TANGGAL LAHIR', v: hewan.tanggalLahir.toLocaleDateString('id-ID'), sub: `${umurBulan} bulan` },
              { icon: <Scale size={12} />, l: 'BERAT TERKINI', v: hewan.berat ? `${hewan.berat} kg` : '—', sub: 'tertimbang terakhir' },
              { icon: <MapPin size={12} />, l: 'FARM', v: hewan.farm.nama.replace('Farm ', ''), sub: 'lokasi terdaftar' },
              { icon: <Activity size={12} />, l: 'REKAM MEDIS', v: `${hewan.rekamMedis.length}`, sub: 'catatan tersimpan' },
            ].map((c) => (
              <div key={c.l} className="p-3 rounded-xl" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
                <div className="flex items-center gap-1.5 opacity-60" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em' }}>
                  {c.icon} {c.l}
                </div>
                <div className="mt-1.5" style={{ fontFamily: "'Fraunces',serif", fontSize: 20, letterSpacing: '-0.02em' }}>{c.v}</div>
                <div className="opacity-55" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </KostaCard>

      {/* Weight history */}
      {hewan.beratHistory.length > 0 && (
        <KostaCard className="p-6 mb-5">
          <KostaSectionLabel>RIWAYAT PENIMBANGAN</KostaSectionLabel>
          <div className="mt-4 divide-y" style={{ borderColor: palette.border }}>
            {hewan.beratHistory.map((h) => (
              <div key={h.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5 }}>
                    {h.tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {h.catatan && (
                    <div className="opacity-55 mt-0.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
                      {h.catatan}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, letterSpacing: '-0.02em', color: palette.moss }}>
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
      <KostaCard className="p-6 mt-5">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch size={13} style={{ color: palette.moss }} />
          <KostaSectionLabel>SILSILAH KETURUNAN</KostaSectionLabel>
        </div>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)', marginBottom: 20 }}>
          Pohon silsilah dihitung dari semua leluhur yang tercatat di sistem.
        </p>
        <SilsilahTree tree={silsilahTree} />
      </KostaCard>
    </div>
  )
}
