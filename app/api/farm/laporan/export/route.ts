/**
 * KostaHub — Farm Laporan Excel Export
 *
 * Exports all 4 laporan sections per farm:
 * 1. Keluar-Masuk Ternak  2. Kesehatan & Medis
 * 3. Kartu Breeding       4. Pertumbuhan Bobot
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  forest:    'FF1B2A1F',
  forestMid: 'FF243326',
  forestLt:  'FF2D4A32',
  ochre:     'FFC7873E',
  moss:      'FF3F5B3A',
  cream:     'FFF2EDE0',
  sageFill:  'FFD6EACC',
  sageLight: 'FFF3F7F1',
  rowAlt:    'FFF8FBF6',
  red:       'FFB5443B',
  redFill:   'FFFADADD',
  amber:     'FF8B6500',
  amberFill: 'FFFFF4C2',
  blue:      'FF1A4E8B',
  blueFill:  'FFDDEEFF',
  border:    'FFC8D5C4',
  borderHvy: 'FF3F5B3A',
  totals:    'FFEBF0E8',
  muted:     'FF718070',
  white:     'FFFFFFFF',
}

const solid = (argb: string): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

const thinBorder = (): Partial<ExcelJS.Borders> => ({
  top:    { style: 'thin',   color: { argb: C.border } },
  bottom: { style: 'thin',   color: { argb: C.border } },
  left:   { style: 'thin',   color: { argb: C.border } },
  right:  { style: 'thin',   color: { argb: C.border } },
})

const hdrBorder = (): Partial<ExcelJS.Borders> => ({
  bottom: { style: 'medium', color: { argb: C.ochre } },
  left:   { style: 'thin',   color: { argb: C.border } },
  right:  { style: 'thin',   color: { argb: C.border } },
})

const totalsBorder = (): Partial<ExcelJS.Borders> => ({
  top:    { style: 'medium', color: { argb: C.borderHvy } },
  bottom: { style: 'double', color: { argb: C.borderHvy } },
  left:   { style: 'thin',   color: { argb: C.border } },
  right:  { style: 'thin',   color: { argb: C.border } },
})

type SetCellOpts = {
  font?:   Partial<ExcelJS.Font>
  fill?:   ExcelJS.Fill
  align?:  Partial<ExcelJS.Alignment>
  border?: Partial<ExcelJS.Borders>
  numFmt?: string
}

function sc(cell: ExcelJS.Cell, value: ExcelJS.CellValue, opts: SetCellOpts = {}) {
  cell.value = value
  if (opts.font)   cell.font      = opts.font
  if (opts.fill)   cell.fill      = opts.fill
  if (opts.align)  cell.alignment = opts.align
  if (opts.border) cell.border    = opts.border
  if (opts.numFmt) cell.numFmt    = opts.numFmt
}

const L: Partial<ExcelJS.Alignment> = { horizontal: 'left',   vertical: 'middle' }
const CTR: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' }
const WRP: Partial<ExcelJS.Alignment> = { horizontal: 'left',   vertical: 'middle', wrapText: true }

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Sheet header builder ─────────────────────────────────────────────────────

interface KpiItem { label: string; value: string | number; argb: string }

function buildSheetHeader(
  ws:      ExcelJS.Worksheet,
  title:   string,
  sub:     string,
  cols:    number,
  farmName: string,
  kpis:    KpiItem[],
): number {
  // Row 1 — brand bar
  ws.getRow(1).height = 36
  for (let c = 1; c <= cols; c++) ws.getRow(1).getCell(c).fill = solid(C.forest)
  ws.mergeCells(1, 1, 1, cols - 1)
  sc(ws.getRow(1).getCell(1), `KostaHub · ${farmName}`, {
    font:  { name: 'Calibri', bold: true, size: 18, color: { argb: C.cream } },
    fill:  solid(C.forest), align: L,
  })
  sc(ws.getRow(1).getCell(cols), 'LAPORAN FARM', {
    font:  { name: 'Calibri', size: 8, italic: true, color: { argb: 'FFA8BCA8' } },
    fill:  solid(C.forest), align: { horizontal: 'right', vertical: 'middle' },
  })

  // Row 2 — section title
  ws.getRow(2).height = 26
  for (let c = 1; c <= cols; c++) ws.getRow(2).getCell(c).fill = solid(C.forestMid)
  ws.mergeCells(2, 1, 2, cols)
  sc(ws.getRow(2).getCell(1), title, {
    font:  { name: 'Calibri', size: 13, bold: true, color: { argb: C.ochre } },
    fill:  solid(C.forestMid), align: L,
  })

  // Row 3 — subtitle + date
  ws.getRow(3).height = 16
  for (let c = 1; c <= cols; c++) ws.getRow(3).getCell(c).fill = solid(C.moss)
  ws.mergeCells(3, 1, 3, cols)
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  sc(ws.getRow(3).getCell(1), `${sub}   ·   ${dateStr}`, {
    font:  { name: 'Calibri', size: 9, italic: true, color: { argb: 'FFCDE3CD' } },
    fill:  solid(C.moss), align: L,
  })

  // Rows 4-5 — KPI tiles
  ws.getRow(4).height = 38
  ws.getRow(5).height = 16
  const kpiSpan = Math.floor(cols / kpis.length)
  kpis.forEach((kpi, i) => {
    const start = i * kpiSpan + 1
    const end   = i === kpis.length - 1 ? cols : (i + 1) * kpiSpan
    if (end > start) {
      ws.mergeCells(4, start, 4, end)
      ws.mergeCells(5, start, 5, end)
    }
    for (let c = start; c <= end; c++) {
      ws.getRow(4).getCell(c).fill = solid('FFF0F4EE')
      ws.getRow(5).getCell(c).fill = solid('FFF0F4EE')
    }
    const vc = ws.getRow(4).getCell(start)
    vc.value     = kpi.value
    vc.font      = { name: 'Calibri', bold: true, size: 22, color: { argb: kpi.argb } }
    vc.fill      = solid('FFF0F4EE')
    vc.alignment = { horizontal: 'center', vertical: 'bottom' }
    if (i < kpis.length - 1) vc.border = { right: { style: 'thin', color: { argb: C.border } } }

    const lc = ws.getRow(5).getCell(start)
    lc.value     = kpi.label.toUpperCase()
    lc.font      = { name: 'Calibri', size: 8, color: { argb: C.muted } }
    lc.fill      = solid('FFF0F4EE')
    lc.alignment = { horizontal: 'center', vertical: 'top' }
  })

  // Row 6 — ochre accent
  ws.getRow(6).height = 4
  for (let c = 1; c <= cols; c++) ws.getRow(6).getCell(c).fill = solid(C.ochre)
  ws.getRow(7).height = 3

  return 8 // first data row
}

function buildTableHeader(ws: ExcelJS.Worksheet, row: number, headers: string[]) {
  ws.getRow(row).height = 24
  headers.forEach((h, i) => {
    const cell = ws.getRow(row).getCell(i + 1)
    cell.value     = h
    cell.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: C.cream } }
    cell.fill      = solid(C.forestLt)
    cell.alignment = CTR
    cell.border    = hdrBorder()
  })
}

function rowFill(i: number) {
  return solid(i % 2 === 0 ? C.rowAlt : C.white)
}

function addTotalsLabel(ws: ExcelJS.Worksheet, rowNum: number, colSpan: number, total: number, label: string) {
  ws.getRow(rowNum).height = 24
  ws.mergeCells(rowNum, 1, rowNum, colSpan)
  const cell = ws.getRow(rowNum).getCell(1)
  cell.value     = `TOTAL — ${total} ${label}`
  cell.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: C.muted } }
  cell.fill      = solid(C.totals)
  cell.alignment = L
  cell.border    = totalsBorder()
  // Fill rest
  for (let c = colSpan + 1; c <= ws.columnCount; c++) {
    const tc = ws.getRow(rowNum).getCell(c)
    tc.fill   = solid(C.totals)
    tc.border = totalsBorder()
  }
}

// ─── Status / kategori badges ─────────────────────────────────────────────────

function statusFont(status: string): { argb: string; fill: string } {
  const map: Record<string, { argb: string; fill: string }> = {
    AKTIF:   { argb: C.moss,  fill: C.sageFill  },
    MATI:    { argb: C.red,   fill: C.redFill   },
    TERJUAL: { argb: C.blue,  fill: C.blueFill  },
    HAMIL:   { argb: C.amber, fill: C.amberFill },
    LAHIR:   { argb: C.moss,  fill: C.sageFill  },
    GAGAL:   { argb: C.red,   fill: C.redFill   },
    SEMBUH:  { argb: C.moss,  fill: C.sageFill  },
    RAWAT:   { argb: C.red,   fill: C.redFill   },
    PANTAU:  { argb: C.amber, fill: C.amberFill },
  }
  return map[status] ?? { argb: C.muted, fill: C.sageLight }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url    = new URL(request.url)
  const farmId = url.searchParams.get('farmId') ?? session.activeFarmId

  if (!farmId) return NextResponse.json({ error: 'Farm ID diperlukan' }, { status: 400 })

  // Verify access
  if (session.role !== 'SUPER_ADMIN') {
    if (session.activeFarmId !== farmId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { nama: true, alamat: true, status: true, createdAt: true },
  })
  if (!farm) return NextResponse.json({ error: 'Farm tidak ditemukan' }, { status: 404 })

  // ── Fetch all laporan data ────────────────────────────────────────────────
  const [hewanAll, medisAll, breedingAll, beratAll, mutasiAll] = await Promise.all([
    prisma.hewan.findMany({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
      select: {
        tag: true, nama: true, kelamin: true, kategori: true,
        status: true, berat: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.rekamMedis.findMany({
      where: { hewan: { farmId } },
      orderBy: { tanggal: 'desc' },
      select: {
        tanggal: true, kategori: true, diagnosis: true, obat: true,
        namaDokter: true, notes: true, tanggalLanjut: true,
        hewan: { select: { tag: true, nama: true } },
      },
    }),
    prisma.reproduksi.findMany({
      where: { induk: { farmId } },
      orderBy: { tanggalKawin: 'desc' },
      select: {
        tanggalKawin: true, estimasiLahir: true, status: true, inbreedingWarning: true,
        induk:    { select: { tag: true, nama: true, berat: true } },
        pejantan: { select: { tag: true, nama: true, berat: true } },
        anak:     { select: { tag: true, nama: true, kelamin: true, berat: true } },
      },
    }),
    prisma.beratBadan.findMany({
      where: { hewan: { farmId } },
      orderBy: [{ hewanId: 'asc' }, { tanggal: 'asc' }],
      select: {
        tanggal: true, berat: true, catatan: true,
        hewan: { select: { tag: true, nama: true, kategori: true } },
      },
    }),
    prisma.transferHewan.findMany({
      where: { OR: [{ fromFarmId: farmId }, { toFarmId: farmId }] },
      orderBy: { tanggal: 'desc' },
      select: {
        tanggal: true, alasan: true,
        hewan:    { select: { tag: true, nama: true, kategori: true } },
        fromFarm: { select: { nama: true } },
        toFarm:   { select: { nama: true } },
      },
    }),
  ])

  // Aggregate
  const hewanAktif   = hewanAll.filter(h => h.status === 'AKTIF').length
  const hewanMati    = hewanAll.filter(h => h.status === 'MATI').length
  const hewanTerjual = hewanAll.filter(h => h.status === 'TERJUAL').length
  const hewanHamil   = breedingAll.filter(b => b.status === 'HAMIL').length
  const totalMedis   = medisAll.length
  const totalBreeding= breedingAll.length

  // Group berat per hewan
  const beratMap = new Map<string, { hewan: { tag: string; nama: string | null; kategori: string }; records: { tanggal: Date; berat: number }[] }>()
  beratAll.forEach(b => {
    if (!beratMap.has(b.hewan.tag)) beratMap.set(b.hewan.tag, { hewan: b.hewan, records: [] })
    beratMap.get(b.hewan.tag)!.records.push({ tanggal: b.tanggal, berat: b.berat })
  })
  const pertumbuhan = Array.from(beratMap.values()).map(entry => {
    const recs = entry.records
    const bAwal  = recs[0]?.berat ?? 0
    const bAkhir = recs[recs.length - 1]?.berat ?? 0
    const selisih = Math.round((bAkhir - bAwal) * 10) / 10
    const days   = recs.length > 1
      ? (recs[recs.length - 1].tanggal.getTime() - recs[0].tanggal.getTime()) / 86400000
      : 0
    const adg    = days > 0 ? Math.round((selisih / days) * 1000) / 1000 : 0
    return { hewan: entry.hewan, bAwal, bAkhir, selisih, adg, totalRec: recs.length }
  })

  // ── Workbook ──────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'KostaHub System'
  wb.created  = new Date()
  wb.modified = new Date()

  const FN = farm.nama // short alias

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 1: Keluar-Masuk Ternak
  // ════════════════════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('Keluar-Masuk Ternak', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
  })

  const cols1 = [
    { w: 5,  label: 'No'        },
    { w: 14, label: 'Tag'       },
    { w: 22, label: 'Nama'      },
    { w: 12, label: 'Kategori'  },
    { w: 10, label: 'Kelamin'   },
    { w: 12, label: 'Status'    },
    { w: 10, label: 'Berat (kg)'},
    { w: 16, label: 'Tgl Daftar'},
    { w: 16, label: 'Tgl Update'},
  ]
  cols1.forEach((c, i) => { ws1.getColumn(i + 1).width = c.w })

  const start1 = buildSheetHeader(ws1, 'Laporan Keluar-Masuk Ternak', `${hewanAll.length} ekor tercatat`, cols1.length, FN, [
    { label: 'Hewan Aktif',  value: hewanAktif,   argb: C.moss  },
    { label: 'Kematian',     value: hewanMati,    argb: C.red   },
    { label: 'Terjual',      value: hewanTerjual, argb: C.blue  },
    { label: 'Total Mutasi', value: mutasiAll.length, argb: C.amber },
  ])

  buildTableHeader(ws1, start1, cols1.map(c => c.label))
  ws1.autoFilter = { from: { row: start1, column: 1 }, to: { row: start1, column: cols1.length } }

  hewanAll.forEach((h, i) => {
    const rn  = start1 + 1 + i
    const rf  = rowFill(i)
    ws1.getRow(rn).height = 20

    sc(ws1.getRow(rn).getCell(1), i + 1, { font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder() })
    sc(ws1.getRow(rn).getCell(2), h.tag, { font: { name: 'Calibri', size: 10, bold: true, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })
    sc(ws1.getRow(rn).getCell(3), h.nama ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })
    sc(ws1.getRow(rn).getCell(4), h.kategori.replace('_', ' '), { font: { name: 'Calibri', size: 9, color: { argb: C.moss } }, fill: rf, align: CTR, border: thinBorder() })
    sc(ws1.getRow(rn).getCell(5), h.kelamin === 'JANTAN' ? '♂ Jantan' : '♀ Betina', {
      font:  { name: 'Calibri', size: 9, color: { argb: h.kelamin === 'JANTAN' ? C.blue : C.red } },
      fill: rf, align: CTR, border: thinBorder(),
    })

    // Status badge
    const ss = statusFont(h.status)
    const statusCell = ws1.getRow(rn).getCell(6)
    statusCell.value     = h.status
    statusCell.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: ss.argb } }
    statusCell.fill      = solid(ss.fill)
    statusCell.alignment = CTR
    statusCell.border    = thinBorder()

    sc(ws1.getRow(rn).getCell(7), h.berat ?? 0, {
      font: { name: 'Calibri', size: 11, color: { argb: C.forest } }, fill: rf, align: CTR, border: thinBorder(), numFmt: '0.0',
    })
    sc(ws1.getRow(rn).getCell(8), formatDate(h.createdAt), {
      font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder(),
    })
    sc(ws1.getRow(rn).getCell(9), formatDate(h.updatedAt), {
      font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder(),
    })
  })
  addTotalsLabel(ws1, start1 + 1 + hewanAll.length, 4, hewanAll.length, 'ekor ternak')

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 2: Kesehatan & Medis
  // ════════════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Kesehatan & Medis', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
  })

  const cols2 = [
    { w: 5,  label: 'No'           },
    { w: 14, label: 'Tanggal'      },
    { w: 12, label: 'Tag'          },
    { w: 18, label: 'Nama Hewan'   },
    { w: 14, label: 'Kategori'     },
    { w: 30, label: 'Diagnosis'    },
    { w: 22, label: 'Obat / Vaksin'},
    { w: 18, label: 'Dokter'       },
    { w: 14, label: 'Kontrol Lanjut'},
  ]
  cols2.forEach((c, i) => { ws2.getColumn(i + 1).width = c.w })

  const medisKat = new Map<string, number>()
  medisAll.forEach(m => medisKat.set(m.kategori, (medisKat.get(m.kategori) ?? 0) + 1))

  const start2 = buildSheetHeader(ws2, 'Laporan Kesehatan & Medis', `${totalMedis} rekam medis`, cols2.length, FN, [
    { label: 'Total Rekaman', value: totalMedis,                      argb: C.moss  },
    { label: 'Vaksinasi',     value: medisKat.get('VAKSINASI') ?? 0,  argb: C.moss  },
    { label: 'Pengobatan',    value: medisKat.get('PENGOBATAN') ?? 0, argb: C.red   },
    { label: 'Pemeriksaan',   value: medisKat.get('PEMERIKSAAN') ?? 0,argb: C.blue  },
  ])

  buildTableHeader(ws2, start2, cols2.map(c => c.label))
  ws2.autoFilter = { from: { row: start2, column: 1 }, to: { row: start2, column: cols2.length } }

  medisAll.forEach((m, i) => {
    const rn = start2 + 1 + i
    const rf = rowFill(i)
    ws2.getRow(rn).height = 22

    sc(ws2.getRow(rn).getCell(1), i + 1, { font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder() })
    sc(ws2.getRow(rn).getCell(2), formatDate(m.tanggal), { font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder() })
    sc(ws2.getRow(rn).getCell(3), m.hewan.tag, { font: { name: 'Calibri', size: 10, bold: true, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })
    sc(ws2.getRow(rn).getCell(4), m.hewan.nama ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })

    // Kategori with colour
    const katColors: Record<string, string> = {
      VAKSINASI: C.moss, VITAMIN: C.amber, PENGOBATAN: C.red, PEMERIKSAAN: C.blue, PERAWATAN_LUKA: C.ochre, LAINNYA: C.muted,
    }
    const katColor = katColors[m.kategori] ?? C.muted
    sc(ws2.getRow(rn).getCell(5), m.kategori.replace('_', ' '), {
      font:  { name: 'Calibri', size: 9, bold: true, color: { argb: katColor } },
      fill:  solid(katColor === C.moss ? C.sageFill : katColor === C.red ? C.redFill : katColor === C.blue ? C.blueFill : C.amberFill),
      align: CTR, border: thinBorder(),
    })

    sc(ws2.getRow(rn).getCell(6), m.diagnosis ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.forest } }, fill: rf, align: WRP, border: thinBorder() })
    sc(ws2.getRow(rn).getCell(7), m.obat ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.muted } }, fill: rf, align: L, border: thinBorder() })
    sc(ws2.getRow(rn).getCell(8), m.namaDokter ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.muted } }, fill: rf, align: L, border: thinBorder() })

    sc(ws2.getRow(rn).getCell(9), m.tanggalLanjut ? formatDate(m.tanggalLanjut) : '—', {
      font: { name: 'Calibri', size: 9, color: { argb: m.tanggalLanjut ? C.amber : C.muted } }, fill: rf, align: CTR, border: thinBorder(),
    })
  })
  addTotalsLabel(ws2, start2 + 1 + medisAll.length, 4, medisAll.length, 'rekam medis')

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 3: Kartu Breeding
  // ════════════════════════════════════════════════════════════════════════════
  const ws3 = wb.addWorksheet('Kartu Breeding', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
  })

  const cols3 = [
    { w: 5,  label: 'No'            },
    { w: 14, label: 'Tgl Kawin'     },
    { w: 14, label: 'Tag Induk'     },
    { w: 18, label: 'Nama Induk'    },
    { w: 14, label: 'Tag Pejantan'  },
    { w: 18, label: 'Nama Pejantan' },
    { w: 14, label: 'Est. Lahir'    },
    { w: 12, label: 'Status'        },
    { w: 14, label: 'Kawin Sedarah' },
    { w: 14, label: 'Tag Anak'      },
    { w: 10, label: 'Kelamin Anak'  },
    { w: 10, label: 'Berat Anak'    },
  ]
  cols3.forEach((c, i) => { ws3.getColumn(i + 1).width = c.w })

  const breedHamil = breedingAll.filter(b => b.status === 'HAMIL').length
  const breedLahir = breedingAll.filter(b => b.status === 'LAHIR').length
  const breedGagal = breedingAll.filter(b => b.status === 'GAGAL').length

  const start3 = buildSheetHeader(ws3, 'Kartu Breeding & Reproduksi', `${totalBreeding} kartu perkawinan`, cols3.length, FN, [
    { label: 'Sedang Hamil', value: breedHamil, argb: C.amber },
    { label: 'Berhasil Lahir',value: breedLahir, argb: C.moss  },
    { label: 'Gagal',        value: breedGagal, argb: C.red   },
    { label: 'Total',        value: totalBreeding, argb: C.forest },
  ])

  buildTableHeader(ws3, start3, cols3.map(c => c.label))
  ws3.autoFilter = { from: { row: start3, column: 1 }, to: { row: start3, column: cols3.length } }

  breedingAll.forEach((r, i) => {
    const rn = start3 + 1 + i
    const rf = rowFill(i)
    ws3.getRow(rn).height = 20

    sc(ws3.getRow(rn).getCell(1),  i + 1, { font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder() })
    sc(ws3.getRow(rn).getCell(2),  formatDate(r.tanggalKawin), { font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder() })
    sc(ws3.getRow(rn).getCell(3),  r.induk?.tag ?? '—', { font: { name: 'Calibri', size: 10, bold: true, color: { argb: C.red } }, fill: rf, align: L, border: thinBorder() })
    sc(ws3.getRow(rn).getCell(4),  r.induk?.nama ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })
    sc(ws3.getRow(rn).getCell(5),  r.pejantan?.tag ?? '—', { font: { name: 'Calibri', size: 10, bold: true, color: { argb: C.blue } }, fill: rf, align: L, border: thinBorder() })
    sc(ws3.getRow(rn).getCell(6),  r.pejantan?.nama ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })
    sc(ws3.getRow(rn).getCell(7),  formatDate(r.estimasiLahir), { font: { name: 'Calibri', size: 9, color: { argb: C.amber } }, fill: rf, align: CTR, border: thinBorder() })

    const bs = statusFont(r.status)
    const scell = ws3.getRow(rn).getCell(8)
    scell.value = r.status; scell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: bs.argb } }
    scell.fill = solid(bs.fill); scell.alignment = CTR; scell.border = thinBorder()

    // Inbreeding
    const ibCell = ws3.getRow(rn).getCell(9)
    ibCell.value     = r.inbreedingWarning ? 'RISIKO' : 'Aman'
    ibCell.font      = { name: 'Calibri', size: 9, bold: r.inbreedingWarning, color: { argb: r.inbreedingWarning ? C.red : C.moss } }
    ibCell.fill      = r.inbreedingWarning ? solid(C.redFill) : rf
    ibCell.alignment = CTR
    ibCell.border    = thinBorder()

    sc(ws3.getRow(rn).getCell(10), r.anak?.tag ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })
    sc(ws3.getRow(rn).getCell(11), r.anak?.kelamin ? (r.anak.kelamin === 'JANTAN' ? '♂' : '♀') : '—', {
      font:  { name: 'Calibri', size: 11, color: { argb: r.anak?.kelamin === 'JANTAN' ? C.blue : C.red } }, fill: rf, align: CTR, border: thinBorder(),
    })
    sc(ws3.getRow(rn).getCell(12), r.anak?.berat ?? 0, {
      font: { name: 'Calibri', size: 10, color: { argb: C.forest } }, fill: rf, align: CTR, border: thinBorder(), numFmt: '0.0',
    })
  })
  addTotalsLabel(ws3, start3 + 1 + breedingAll.length, 4, breedingAll.length, 'kartu breeding')

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 4: Pertumbuhan Bobot
  // ════════════════════════════════════════════════════════════════════════════
  const ws4 = wb.addWorksheet('Pertumbuhan Bobot', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
  })

  const cols4 = [
    { w: 5,  label: 'No'          },
    { w: 14, label: 'Tag'         },
    { w: 22, label: 'Nama'        },
    { w: 14, label: 'Kategori'    },
    { w: 12, label: 'Berat Awal'  },
    { w: 12, label: 'Berat Akhir' },
    { w: 12, label: 'Selisih (kg)'},
    { w: 14, label: 'ADG (kg/hr)' },
    { w: 12, label: 'Total Rekam' },
  ]
  cols4.forEach((c, i) => { ws4.getColumn(i + 1).width = c.w })

  const avgAdg  = pertumbuhan.length ? Math.round(pertumbuhan.reduce((s, p) => s + p.adg, 0) / pertumbuhan.length * 1000) / 1000 : 0
  const avgBerat = pertumbuhan.length ? Math.round(pertumbuhan.reduce((s, p) => s + p.bAkhir, 0) / pertumbuhan.length * 10) / 10 : 0

  const start4 = buildSheetHeader(ws4, 'Pertumbuhan Bobot Ternak', `${pertumbuhan.length} ternak terpantau`, cols4.length, FN, [
    { label: 'Terpantau',    value: pertumbuhan.length, argb: C.moss   },
    { label: 'Avg Berat',    value: `${avgBerat} kg`,   argb: C.ochre  },
    { label: 'Avg ADG',      value: `${avgAdg} kg/hr`,  argb: C.forest },
  ])

  buildTableHeader(ws4, start4, cols4.map(c => c.label))
  ws4.autoFilter = { from: { row: start4, column: 1 }, to: { row: start4, column: cols4.length } }

  // Sort by ADG desc
  const sortedPert = [...pertumbuhan].sort((a, b) => b.adg - a.adg)
  sortedPert.forEach((p, i) => {
    const rn = start4 + 1 + i
    const rf = rowFill(i)
    ws4.getRow(rn).height = 20

    sc(ws4.getRow(rn).getCell(1), i + 1, { font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder() })
    sc(ws4.getRow(rn).getCell(2), p.hewan.tag, { font: { name: 'Calibri', size: 10, bold: true, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })
    sc(ws4.getRow(rn).getCell(3), p.hewan.nama ?? '—', { font: { name: 'Calibri', size: 10, color: { argb: C.forest } }, fill: rf, align: L, border: thinBorder() })
    sc(ws4.getRow(rn).getCell(4), p.hewan.kategori.replace('_', ' '), { font: { name: 'Calibri', size: 9, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder() })

    sc(ws4.getRow(rn).getCell(5), p.bAwal, { font: { name: 'Calibri', size: 11, color: { argb: C.forest } }, fill: rf, align: CTR, border: thinBorder(), numFmt: '0.0' })
    sc(ws4.getRow(rn).getCell(6), p.bAkhir, { font: { name: 'Calibri', size: 11, bold: true, color: { argb: C.forest } }, fill: rf, align: CTR, border: thinBorder(), numFmt: '0.0' })

    const selFill = p.selisih > 0 ? solid(C.sageFill) : p.selisih < 0 ? solid(C.redFill) : rf
    const selArgb = p.selisih > 0 ? C.moss : p.selisih < 0 ? C.red : C.muted
    sc(ws4.getRow(rn).getCell(7), p.selisih, {
      font:  { name: 'Calibri', size: 11, bold: true, color: { argb: selArgb } },
      fill:  selFill, align: CTR, border: thinBorder(), numFmt: '+0.0;-0.0;0.0',
    })

    const adgArgb = p.adg > 0.05 ? C.moss : p.adg < 0 ? C.red : C.amber
    sc(ws4.getRow(rn).getCell(8), p.adg, {
      font:  { name: 'Calibri', size: 10, bold: true, color: { argb: adgArgb } },
      fill:  rf, align: CTR, border: thinBorder(), numFmt: '0.000',
    })

    sc(ws4.getRow(rn).getCell(9), p.totalRec, { font: { name: 'Calibri', size: 10, color: { argb: C.muted } }, fill: rf, align: CTR, border: thinBorder() })
  })
  addTotalsLabel(ws4, start4 + 1 + sortedPert.length, 4, pertumbuhan.length, 'ternak dipantau')

  // ── Serialize ──────────────────────────────────────────────────────────────
  const buf  = await wb.xlsx.writeBuffer()
  const date = new Date().toISOString().split('T')[0]
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const safeName = farm.nama.replace(/[^a-zA-Z0-9]/g, '-')

  return new NextResponse(blob, {
    headers: {
      'Content-Disposition': `attachment; filename="KostaHub-Laporan-${safeName}-${date}.xlsx"`,
      'Cache-Control':       'no-store',
    },
  })
}
