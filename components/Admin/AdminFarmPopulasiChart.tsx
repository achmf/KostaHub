'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const kategoriLabel: Record<string, string> = {
  INDUKAN: 'Indukan',
  PEJANTAN: 'Pejantan',
  ANAKAN: 'Anakan',
  DARA: 'Dara',
  JANTAN_MUDA: 'Jantan Muda',
}

const kategoriColor: Record<string, string> = {
  INDUKAN: '#B5443B',
  PEJANTAN: '#2C5F8A',
  ANAKAN: '#C7873E',
  DARA: '#5A7A4E',
  JANTAN_MUDA: '#7A6C4E',
}

const fallbackColors = ['#3F5B3A', '#C7873E', '#2C5F8A', '#B5443B', '#7A6C4E', '#5A7A4E']

interface Props {
  byKategori: [string, number][]
  hewanHidup: number
  betina: number
  jantan: number
  ratarataBerat: number | null
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; pct: number } }[] }) {
  if (!active || !payload?.length) return null
  const { name, value, pct } = payload[0].payload
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid rgba(13,20,15,0.09)',
        borderRadius: 10,
        padding: '8px 12px',
        fontFamily: "'Inter',sans-serif",
        fontSize: 12,
        boxShadow: '0 4px 16px rgba(13,20,15,0.08)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{name}</div>
      <div style={{ color: 'rgba(13,20,15,0.55)' }}>
        {value} ekor · {pct}%
      </div>
    </div>
  )
}

export default function AdminFarmPopulasiChart({ byKategori, hewanHidup, betina, jantan, ratarataBerat }: Props) {
  const data = byKategori.map(([kat, jumlah], i) => ({
    name: kategoriLabel[kat] || kat,
    value: jumlah,
    pct: hewanHidup > 0 ? Math.round((jumlah / hewanHidup) * 100) : 0,
    color: kategoriColor[kat] || fallbackColors[i % fallbackColors.length],
    kat,
  }))

  if (data.length === 0) return null

  // Breakpoint pakai lebar kartu (container query), bukan viewport — sidebar admin ikut makan lebar.
  return (
    <div className="@container">
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 @3xl:flex-nowrap @3xl:justify-between">
        {/* Chart */}
        <div className="shrink-0" style={{ width: 180, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend — kolom selebar isinya supaya angka tetap dekat dengan labelnya */}
        <div className="grid gap-x-16 gap-y-4 @5xl:grid-cols-[auto_auto]">
          {data.map((entry) => (
            <div key={entry.kat} className="flex items-center gap-2.5">
              <div className="shrink-0 w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
              <div className="flex-1 whitespace-nowrap" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: '#0D140F' }}>
                {entry.name}
              </div>
              <div className="shrink-0 flex items-baseline gap-1.5 pl-4">
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 15, color: '#0D140F' }}>{entry.value}</span>
                <span className="w-6 text-right" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.45)' }}>
                  {entry.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden @3xl:block shrink-0 w-px h-24" style={{ background: 'rgba(13,20,15,0.09)' }} />
        <div className="@3xl:hidden w-full h-px" style={{ background: 'rgba(13,20,15,0.09)' }} />

        {/* Stats */}
        <div className="shrink-0 flex gap-10">
          <div className="text-center">
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: '#2C5F8A' }}>{betina}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'rgba(13,20,15,0.45)', letterSpacing: '0.1em' }}>BETINA ♀</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: '#B5443B' }}>{jantan}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'rgba(13,20,15,0.45)', letterSpacing: '0.1em' }}>JANTAN ♂</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: '#0D140F' }}>
              {ratarataBerat ?? '—'}{ratarataBerat && <span style={{ fontSize: 11 }}> kg</span>}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'rgba(13,20,15,0.45)', letterSpacing: '0.1em' }}>RATA-RATA BERAT</div>
          </div>
        </div>
      </div>
    </div>
  )
}
