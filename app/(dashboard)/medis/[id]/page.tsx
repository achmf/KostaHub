import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Edit, Calendar, Activity } from 'lucide-react'
import Link from 'next/link'
import { Badge, KostaCard, KostaButton } from '@/components/KostaUI'
import { RekamMedisHistory } from '@/components/Hewan/RekamMedisHistory'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  ochre: '#C7873E',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  emerald: '#3F7A4E',
}

export default async function RekamMedisHewanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getSession()
  if (!session) redirect('/login')

  const hewanId = params.id
  const hewan = await prisma.hewan.findUnique({
    where: { id: hewanId },
    include: {
      farm: true,
      rekamMedis: { orderBy: { tanggal: 'desc' } },
    },
  })

  if (!hewan) notFound()
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) redirect('/medis')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/medis"
          className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
        >
          <ArrowLeft size={14} /> Kembali ke Rekam Medis
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/hewan/${hewan.id}`}>
            <KostaButton variant="outline" size="sm">
              Buka Profil Hewan
            </KostaButton>
          </Link>
          <Link href={`/medis/tambah?hewanId=${hewan.id}`}>
            <KostaButton size="sm">
              + Tambah Catatan
            </KostaButton>
          </Link>
        </div>
      </div>

      {/* Hero card */}
      <KostaCard className="overflow-hidden mb-5">
        <div className="px-8 py-8" style={{ background: palette.forest, color: palette.cream }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.18em', opacity: 0.55 }}>
                {hewan.tag}
              </div>
              <h1 className="mt-3 mb-4" style={{ fontFamily: "'Fraunces',serif", fontSize: '2.5rem', lineHeight: 1, letterSpacing: '-0.025em' }}>
                Riwayat Medis: {hewan.nama || 'Tanpa Nama'}
              </h1>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={hewan.kelamin === 'JANTAN' ? 'ink' : 'cream'} surface="dark">
                  {hewan.kelamin === 'BETINA' ? '♀ Betina' : '♂ Jantan'}
                </Badge>
                {hewan.status === 'AKTIF' && <Badge variant="emerald" surface="dark">Aktif</Badge>}
                {hewan.status === 'MATI' && <Badge variant="rose" surface="dark">Mati</Badge>}
                {hewan.status === 'TERJUAL' && <Badge variant="cream" surface="dark">Terjual</Badge>}
              </div>
            </div>
            <div className="text-right">
              <div className="opacity-50" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>TOTAL CATATAN</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: '3rem', lineHeight: 1, color: palette.cream }}>
                {hewan.rekamMedis.length}
              </div>
            </div>
          </div>
        </div>
      </KostaCard>

      {/* Medical records list */}
      <RekamMedisHistory records={hewan.rekamMedis} />
    </div>
  )
}
