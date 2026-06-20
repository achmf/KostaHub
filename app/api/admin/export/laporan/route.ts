/**
 * KostaHub — Laporan Regional Excel Export
 *
 * Generates a richly-formatted Excel file specific to the
 * Admin Laporan page: executive summary + per-farm monitoring
 * with mortality rates, health scores, and operational metrics.
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
  ochreSoft: 'FFE2B883',
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

// ─── Style Factories ──────────────────────────────────────────────────────────

const solid = (argb: string): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

const noFill = (): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'none' })

void noFill // suppress unused warning

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setCell(
  cell: ExcelJS.Cell,
  value: ExcelJS.CellValue,
  opts: {
    font?:      Partial<ExcelJS.Font>
    fill?:      ExcelJS.Fill
    align?:     Partial<ExcelJS.Alignment>
    border?:    Partial<ExcelJS.Borders>
    numFmt?:    string
  } = {}
) {
  cell.value = value
  if (opts.font)   cell.font      = opts.font
  if (opts.fill)   cell.fill      = opts.fill
  if (opts.align)  cell.alignment = opts.align
  if (opts.border) cell.border    = opts.border
  if (opts.numFmt) cell.numFmt    = opts.numFmt
}

const LEFT:   Partial<ExcelJS.Alignment> = { horizontal: 'left',   vertical: 'middle' }
const CENTER: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' }
const WRAP:   Partial<ExcelJS.Alignment> = { horizontal: 'left',   vertical: 'middle', wrapText: true }

// suppress unused — RIGHT kept for future use
const _RIGHT: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle' }
void _RIGHT

// ─── Mortality colour ─────────────────────────────────────────────────────────

function mortalityStyle(rate: number): { fill: string; font: string } {
  if (rate > 15) return { fill: C.redFill,   font: C.red   }
  if (rate > 7)  return { fill: C.amberFill, font: C.amber }
  return              { fill: C.sageFill,   font: C.moss  }
}

// ─── Health Score ─────────────────────────────────────────────────────────────

function healthScore(aktif: number, mati: number, terjual: number): number {
  const total = aktif + mati + terjual
  if (total === 0) return 100
  return Math.round((aktif / total) * 100)
}

function healthStyle(score: number): { fill: string; font: string } {
  if (score >= 80) return { fill: C.sageFill,   font: C.moss  }
  if (score >= 60) return { fill: C.amberFill,  font: C.amber }
  return                  { fill: C.redFill,    font: C.red   }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function applyStatusCell(cell: ExcelJS.Cell, status: string) {
  const map: Record<string, { label: string; fill: string; font: string }> = {
    AKTIF:    { label: 'AKTIF',    fill: C.sageFill,   font: C.moss   },
    NONAKTIF: { label: 'NONAKTIF', fill: C.redFill,    font: C.red    },
    PENDING:  { label: 'PENDING',  fill: C.amberFill,  font: C.amber  },
  }
  const s = map[status] ?? { label: status, fill: C.sageLight, font: C.muted }
  cell.value     = s.label
  cell.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: s.font } }
  cell.fill      = solid(s.fill)
  cell.alignment = CENTER
  cell.border    = thinBorder()
}

// ─── Report header block ──────────────────────────────────────────────────────

interface KpiItem { label: string; value: string | number; argb: string }

function buildHeader(
  ws:       ExcelJS.Worksheet,
  title:    string,
  subtitle: string,
  cols:     number,
  kpis:     KpiItem[],
): number {
  // Row 1 — main brand banner
  ws.getRow(1).height = 38
  for (let c = 1; c <= cols; c++) {
    ws.getRow(1).getCell(c).fill = solid(C.forest)
  }
  ws.mergeCells(1, 1, 1, cols - 1)
  setCell(ws.getRow(1).getCell(1), 'KostaHub', {
    font:  { name: 'Calibri', bold: true, size: 22, color: { argb: C.cream } },
    fill:  solid(C.forest),
    align: LEFT,
  })
  setCell(ws.getRow(1).getCell(cols), 'LAPORAN RESMI', {
    font:  { name: 'Calibri', size: 8, italic: true, color: { argb: 'FFA8BCA8' } },
    fill:  solid(C.forest),
    align: { horizontal: 'right', vertical: 'middle' },
  })

  // Row 2 — report title
  ws.getRow(2).height = 30
  for (let c = 1; c <= cols; c++) {
    ws.getRow(2).getCell(c).fill = solid(C.forestMid)
  }
  ws.mergeCells(2, 1, 2, cols)
  setCell(ws.getRow(2).getCell(1), title, {
    font:  { name: 'Calibri', size: 16, bold: true, color: { argb: C.ochre } },
    fill:  solid(C.forestMid),
    align: LEFT,
  })

  // Row 3 — subtitle / date
  ws.getRow(3).height = 18
  for (let c = 1; c <= cols; c++) {
    ws.getRow(3).getCell(c).fill = solid(C.moss)
  }
  ws.mergeCells(3, 1, 3, cols)
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  setCell(ws.getRow(3).getCell(1), `${subtitle}   ·   ${dateStr}`, {
    font:  { name: 'Calibri', size: 9, italic: true, color: { argb: 'FFCDE3CD' } },
    fill:  solid(C.moss),
    align: LEFT,
  })

  // Rows 4-5 — KPI tiles
  ws.getRow(4).height = 40
  ws.getRow(5).height = 16

  const kpiCols = Math.min(kpis.length, cols)
  const span    = Math.floor(cols / kpiCols)

  kpis.forEach((kpi, i) => {
    const start = i * span + 1
    const end   = i === kpis.length - 1 ? cols : (i + 1) * span

    // Merge value + label cells
    if (end > start) {
      ws.mergeCells(4, start, 4, end)
      ws.mergeCells(5, start, 5, end)
    }

    // Fill all cells in range
    for (let c = start; c <= end; c++) {
      ws.getRow(4).getCell(c).fill = solid('FFF0F4EE')
      ws.getRow(5).getCell(c).fill = solid('FFF0F4EE')
    }

    const valCell = ws.getRow(4).getCell(start)
    valCell.value     = kpi.value
    valCell.font      = { name: 'Calibri', bold: true, size: 24, color: { argb: kpi.argb } }
    valCell.fill      = solid('FFF0F4EE')
    valCell.alignment = { horizontal: 'center', vertical: 'bottom' }

    const lblCell = ws.getRow(5).getCell(start)
    lblCell.value     = kpi.label.toUpperCase()
    lblCell.font      = { name: 'Calibri', size: 8, color: { argb: C.muted } }
    lblCell.fill      = solid('FFF0F4EE')
    lblCell.alignment = { horizontal: 'center', vertical: 'top' }

    // Right divider between KPIs
    if (i < kpis.length - 1) {
      valCell.border = { right: { style: 'thin', color: { argb: C.border } } }
      lblCell.border = { right: { style: 'thin', color: { argb: C.border } } }
    }
  })

  // Row 6 — ochre accent line
  ws.getRow(6).height = 5
  for (let c = 1; c <= cols; c++) {
    ws.getRow(6).getCell(c).fill = solid(C.ochre)
  }

  // Row 7 — spacer
  ws.getRow(7).height = 4

  return 8 // first data row
}

// ─── Table column header row ──────────────────────────────────────────────────

function buildTableHeader(ws: ExcelJS.Worksheet, row: number, headers: string[]) {
  ws.getRow(row).height = 26
  headers.forEach((h, i) => {
    const cell = ws.getRow(row).getCell(i + 1)
    cell.value     = h
    cell.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: C.cream } }
    cell.fill      = solid(C.forestLt)
    cell.alignment = CENTER
    cell.border    = hdrBorder()
  })
}

// ─── Apply alternating data row styling ───────────────────────────────────────

function styleDataRow(ws: ExcelJS.Worksheet, rowNum: number, cols: number, even: boolean) {
  ws.getRow(rowNum).height = 22
  for (let c = 1; c <= cols; c++) {
    const cell = ws.getRow(rowNum).getCell(c)
    if (!cell.fill || (cell.fill as ExcelJS.FillPattern).fgColor?.argb === C.white) {
      cell.fill = solid(even ? C.rowAlt : C.white)
    }
    cell.border = thinBorder()
    if (!cell.font?.name) {
      cell.font      = { name: 'Calibri', size: 10, color: { argb: C.forest } }
      cell.alignment = LEFT
    }
  }
}

// ─── Totals / footer row ──────────────────────────────────────────────────────

function buildTotalsRow(ws: ExcelJS.Worksheet, rowNum: number, cols: number) {
  ws.getRow(rowNum).height = 26
  for (let c = 1; c <= cols; c++) {
    const cell = ws.getRow(rowNum).getCell(c)
    cell.fill   = solid(C.totals)
    cell.border = totalsBorder()
    if (!cell.font?.name) {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: C.forest } }
    }
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Fetch data ────────────────────────────────────────────────────────────
  const farms = await prisma.farm.findMany({
    include: {
      _count: { select: { members: true, hewan: true } },
    },
    orderBy: { nama: 'asc' },
  })

  const farmDetails = await Promise.all(
    farms.map(async (farm) => {
      const [aktif, mati, terjual, hamil, totalMedis, lahir] = await Promise.all([
        prisma.hewan.count({ where: { farmId: farm.id, status: 'AKTIF'   } }),
        prisma.hewan.count({ where: { farmId: farm.id, status: 'MATI'    } }),
        prisma.hewan.count({ where: { farmId: farm.id, status: 'TERJUAL' } }),
        prisma.reproduksi.count({ where: { induk: { farmId: farm.id }, status: 'HAMIL' } }),
        prisma.rekamMedis.count({ where: { hewan: { farmId: farm.id } } }),
        prisma.reproduksi.count({ where: { induk: { farmId: farm.id }, status: 'LAHIR' } }),
      ])
      const total       = aktif + mati + terjual
      const mortality   = total > 0 ? Math.round((mati / total) * 100) : 0
      const health      = healthScore(aktif, mati, terjual)
      return { ...farm, aktif, mati, terjual, hamil, totalMedis, lahir, mortality, health, total }
    })
  )

  // ── Aggregate summaries ───────────────────────────────────────────────────
  const totalFarm   = farms.length
  const farmAktif   = farmDetails.filter(f => f.status === 'AKTIF').length
  const totalHewan  = farmDetails.reduce((s, f) => s + f.aktif, 0)
  const totalMati   = farmDetails.reduce((s, f) => s + f.mati, 0)
  const totalMedis  = farmDetails.reduce((s, f) => s + f.totalMedis, 0)
  const totalStaf   = farmDetails.reduce((s, f) => s + f._count.members, 0)
  const totalHamil  = farmDetails.reduce((s, f) => s + f.hamil, 0)
  const totalTerjual= farmDetails.reduce((s, f) => s + f.terjual, 0)
  const avgMortality= farmDetails.length
    ? Math.round(farmDetails.reduce((s, f) => s + f.mortality, 0) / farmDetails.length)
    : 0

  // ── Workbook setup ────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'KostaHub System'
  wb.lastModifiedBy = session.name ?? 'Super Admin'
  wb.created  = new Date()
  wb.modified = new Date()

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 1: Executive Summary
  // ══════════════════════════════════════════════════════════════════════════
  const wsSum = wb.addWorksheet('Ringkasan Eksekutif', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    views: [{ showGridLines: false }],
  })

  wsSum.getColumn(1).width = 5
  wsSum.getColumn(2).width = 32
  wsSum.getColumn(3).width = 20
  wsSum.getColumn(4).width = 20
  wsSum.getColumn(5).width = 20
  wsSum.getColumn(6).width = 5

  // Top banner
  wsSum.getRow(2).height = 50
  wsSum.mergeCells('B2:E2')
  setCell(wsSum.getCell('B2'), 'KostaHub', {
    font:  { name: 'Calibri', bold: true, size: 34, color: { argb: C.forest } },
    align: { horizontal: 'center', vertical: 'middle' },
  })

  wsSum.getRow(3).height = 22
  wsSum.mergeCells('B3:E3')
  setCell(wsSum.getCell('B3'), 'Laporan Monitoring Peternakan Regional', {
    font:  { name: 'Calibri', size: 13, italic: true, color: { argb: C.ochre } },
    align: { horizontal: 'center', vertical: 'middle' },
  })

  // Ochre separator
  wsSum.getRow(4).height = 4
  for (const c of ['B', 'C', 'D', 'E']) wsSum.getCell(`${c}4`).fill = solid(C.ochre)

  wsSum.getRow(5).height = 12

  // Meta info
  const now = new Date()
  const exportDate = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const metaRows: [string, string][] = [
    ['Tanggal Laporan', exportDate],
    ['Diekspor oleh',   session.name ?? 'Super Admin'],
    ['Periode',         'Data real-time sistem KostaHub'],
  ]
  metaRows.forEach(([label, val], i) => {
    const r = 6 + i
    wsSum.getRow(r).height = 22
    wsSum.mergeCells(r, 2, r, 3)
    setCell(wsSum.getCell(r, 2), label, {
      font:  { name: 'Calibri', size: 10, color: { argb: C.muted } },
      fill:  solid('FFFAFAFA'),
      align: LEFT,
    })
    wsSum.mergeCells(r, 4, r, 5)
    setCell(wsSum.getCell(r, 4), val, {
      font:  { name: 'Calibri', size: 10, bold: true, color: { argb: C.forest } },
      fill:  solid('FFFAFAFA'),
      align: LEFT,
    })
  })

  wsSum.getRow(9).height = 14

  // KPI section header
  wsSum.getRow(10).height = 24
  wsSum.mergeCells('B10:E10')
  setCell(wsSum.getCell('B10'), 'RINGKASAN DATA', {
    font:  { name: 'Calibri', size: 9, bold: true, color: { argb: C.cream } },
    fill:  solid(C.forestLt),
    align: { horizontal: 'center', vertical: 'middle' },
  })

  // KPI grid: 2x4
  const summaryKpis = [
    { col: 'B', label: 'Farm Terdaftar', value: totalFarm,   accent: C.forest },
    { col: 'C', label: 'Farm Aktif',     value: farmAktif,   accent: C.moss   },
    { col: 'D', label: 'Hewan Aktif',    value: totalHewan,  accent: C.ochre  },
    { col: 'E', label: 'Total Kematian', value: totalMati,   accent: C.red    },
  ]
  const summaryKpis2 = [
    { col: 'B', label: 'Total Staf',    value: totalStaf,    accent: C.blue   },
    { col: 'C', label: 'Rekam Medis',   value: totalMedis,   accent: C.moss   },
    { col: 'D', label: 'Sedang Hamil',  value: totalHamil,   accent: C.amber  },
    { col: 'E', label: 'Avg Mortality', value: `${avgMortality}%`, accent: avgMortality > 15 ? C.red : avgMortality > 7 ? C.amber : C.moss },
  ]

  type KpiCard = { col: string; label: string; value: string | number; accent: string }

  const renderKpiRow = (kpis: KpiCard[], valRow: number, lblRow: number) => {
    wsSum.getRow(valRow).height = 40
    wsSum.getRow(lblRow).height = 18
    kpis.forEach(kpi => {
      setCell(wsSum.getCell(`${kpi.col}${valRow}`), kpi.value, {
        font:  { name: 'Calibri', bold: true, size: 26, color: { argb: kpi.accent } },
        fill:  solid(C.sageLight),
        align: { horizontal: 'center', vertical: 'bottom' },
      })
      wsSum.getCell(`${kpi.col}${valRow}`).border = {
        left:  { style: 'thin', color: { argb: C.border } },
        right: { style: 'thin', color: { argb: C.border } },
      }
      setCell(wsSum.getCell(`${kpi.col}${lblRow}`), kpi.label.toUpperCase(), {
        font:  { name: 'Calibri', size: 8, color: { argb: C.muted } },
        fill:  solid(C.sageLight),
        align: { horizontal: 'center', vertical: 'top' },
      })
      wsSum.getCell(`${kpi.col}${lblRow}`).border = {
        left:   { style: 'thin',   color: { argb: C.border } },
        right:  { style: 'thin',   color: { argb: C.border } },
        bottom: { style: 'medium', color: { argb: C.borderHvy } },
      }
    })
  }

  renderKpiRow(summaryKpis,  11, 12)
  wsSum.getRow(13).height = 6
  renderKpiRow(summaryKpis2, 14, 15)

  // Footer note
  wsSum.getRow(17).height = 14
  wsSum.mergeCells('B17:E17')
  setCell(wsSum.getCell('B17'),
    'Laporan ini digenerate otomatis oleh sistem KostaHub. Data bersifat real-time dari database.', {
    font:  { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF9FAF9F' } },
    align: { horizontal: 'center', vertical: 'middle' },
  })

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 2: Detail per Farm (main report)
  // ══════════════════════════════════════════════════════════════════════════
  const wsDetail = wb.addWorksheet('Detail per Farm', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
  })

  // Column definitions
  const detailCols = [
    { width: 5,  label: 'No'            },
    { width: 28, label: 'Nama Farm'      },
    { width: 32, label: 'Alamat'         },
    { width: 12, label: 'Status Farm'    },
    { width: 12, label: 'Hewan Aktif'   },
    { width: 12, label: 'Kematian'       },
    { width: 12, label: 'Terjual'        },
    { width: 12, label: 'Hamil'          },
    { width: 14, label: 'Rekam Medis'   },
    { width: 14, label: 'Mortality %'    },
    { width: 14, label: 'Health Score'   },
    { width: 12, label: 'Jumlah Staf'   },
    { width: 18, label: 'Tgl Daftar'    },
  ]
  detailCols.forEach((c, i) => { wsDetail.getColumn(i + 1).width = c.width })

  const totalCols = detailCols.length

  const dataStart = buildHeader(wsDetail, 'Laporan Detail per Farm', `Total: ${farmDetails.length} farm`, totalCols, [
    { label: 'Farm Terdaftar', value: totalFarm,    argb: C.forest },
    { label: 'Farm Aktif',     value: farmAktif,    argb: C.moss   },
    { label: 'Hewan Aktif',    value: totalHewan,   argb: C.ochre  },
    { label: 'Total Kematian', value: totalMati,    argb: C.red    },
    { label: 'Avg Mortality',  value: `${avgMortality}%`, argb: avgMortality > 15 ? C.red : avgMortality > 7 ? C.amber : C.moss },
  ])

  buildTableHeader(wsDetail, dataStart, detailCols.map(c => c.label))

  wsDetail.autoFilter = {
    from: { row: dataStart, column: 1 },
    to:   { row: dataStart, column: totalCols },
  }

  // Data rows
  farmDetails.forEach((farm, i) => {
    const rowNum = dataStart + 1 + i
    const even   = i % 2 === 0

    // Pre-apply row style
    styleDataRow(wsDetail, rowNum, totalCols, even)

    const r = wsDetail.getRow(rowNum)
    const rowFill = solid(even ? C.rowAlt : C.white)

    // No
    setCell(r.getCell(1), i + 1, {
      font:  { name: 'Calibri', size: 9, color: { argb: C.muted } },
      fill:  rowFill, align: CENTER, border: thinBorder(),
    })

    // Nama Farm
    setCell(r.getCell(2), farm.nama, {
      font:  { name: 'Calibri', size: 11, bold: true, color: { argb: C.forest } },
      fill:  rowFill, align: LEFT, border: thinBorder(),
    })

    // Alamat
    setCell(r.getCell(3), farm.alamat ?? '—', {
      font:  { name: 'Calibri', size: 9, color: { argb: C.muted } },
      fill:  rowFill, align: WRAP, border: thinBorder(),
    })

    // Status
    applyStatusCell(r.getCell(4), farm.status)
    r.getCell(4).fill = rowFill  // override background to match row, keep font/border

    // Hewan Aktif
    setCell(r.getCell(5), farm.aktif, {
      font:  { name: 'Calibri', size: 13, bold: true, color: { argb: C.forest } },
      fill:  rowFill, align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    // Kematian
    const matiColor = farm.mati > 0 ? C.red : C.muted
    setCell(r.getCell(6), farm.mati, {
      font:  { name: 'Calibri', size: 13, bold: farm.mati > 0, color: { argb: matiColor } },
      fill:  farm.mati > 0 ? solid(C.redFill) : rowFill,
      align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    // Terjual
    setCell(r.getCell(7), farm.terjual, {
      font:  { name: 'Calibri', size: 13, color: { argb: C.blue } },
      fill:  farm.terjual > 0 ? solid(C.blueFill) : rowFill,
      align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    // Hamil
    setCell(r.getCell(8), farm.hamil, {
      font:  { name: 'Calibri', size: 13, color: { argb: C.amber } },
      fill:  farm.hamil > 0 ? solid(C.amberFill) : rowFill,
      align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    // Rekam Medis
    setCell(r.getCell(9), farm.totalMedis, {
      font:  { name: 'Calibri', size: 11, color: { argb: C.moss } },
      fill:  rowFill, align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    // Mortality %
    const ms = mortalityStyle(farm.mortality)
    setCell(r.getCell(10), farm.mortality / 100, {
      font:  { name: 'Calibri', size: 11, bold: true, color: { argb: ms.font } },
      fill:  solid(ms.fill),
      align: CENTER, border: thinBorder(), numFmt: '0"%"',
    })
    // Override: store as number for proper display
    r.getCell(10).value = farm.mortality
    r.getCell(10).numFmt = '0"%"'

    // Health Score
    const hs = healthStyle(farm.health)
    setCell(r.getCell(11), farm.health, {
      font:  { name: 'Calibri', size: 11, bold: true, color: { argb: hs.font } },
      fill:  solid(hs.fill),
      align: CENTER, border: thinBorder(), numFmt: '0"%"',
    })

    // Staf
    setCell(r.getCell(12), farm._count.members, {
      font:  { name: 'Calibri', size: 11, color: { argb: C.forest } },
      fill:  rowFill, align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    // Tgl Daftar
    setCell(r.getCell(13), farm.createdAt.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    }), {
      font:  { name: 'Calibri', size: 10, color: { argb: C.muted } },
      fill:  rowFill, align: CENTER, border: thinBorder(),
    })
  })

  // Totals row
  const totalsRow = dataStart + 1 + farmDetails.length
  buildTotalsRow(wsDetail, totalsRow, totalCols)
  const tr = wsDetail.getRow(totalsRow)

  wsDetail.mergeCells(totalsRow, 1, totalsRow, 3)
  setCell(tr.getCell(1), `TOTAL — ${farmDetails.length} FARM`, {
    font:  { name: 'Calibri', size: 9, bold: true, color: { argb: C.muted } },
    fill:  solid(C.totals), align: LEFT, border: totalsBorder(),
  })

  const totalsData: [number, ExcelJS.CellValue, string, string][] = [
    [5,  totalHewan,   '#,##0', C.forest ],
    [6,  totalMati,    '#,##0', C.red    ],
    [7,  totalTerjual, '#,##0', C.blue   ],
    [8,  totalHamil,   '#,##0', C.amber  ],
    [9,  totalMedis,   '#,##0', C.moss   ],
    [12, totalStaf,    '#,##0', C.forest ],
  ]
  totalsData.forEach(([col, val, fmt, argb]) => {
    setCell(tr.getCell(col as number), val, {
      font:   { name: 'Calibri', size: 12, bold: true, color: { argb } },
      fill:   solid(C.totals),
      align:  CENTER,
      border: totalsBorder(),
      numFmt: fmt as string,
    })
  })

  // Avg mortality in totals
  setCell(tr.getCell(10), avgMortality, {
    font:   { name: 'Calibri', size: 12, bold: true, color: { argb: avgMortality > 15 ? C.red : avgMortality > 7 ? C.amber : C.moss } },
    fill:   solid(C.totals),
    align:  CENTER,
    border: totalsBorder(),
    numFmt: '0"%"',
  })

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 3: Mortality & Performance Ranking
  // ══════════════════════════════════════════════════════════════════════════
  const wsRank = wb.addWorksheet('Ranking Performa', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
  })

  const rankCols = [
    { width: 8,  label: 'Rank'         },
    { width: 28, label: 'Nama Farm'     },
    { width: 13, label: 'Status'        },
    { width: 14, label: 'Hewan Aktif'  },
    { width: 12, label: 'Kematian'      },
    { width: 14, label: 'Mortality %'   },
    { width: 14, label: 'Health Score'  },
    { width: 14, label: 'Rekam Medis'  },
    { width: 12, label: 'Staf'          },
  ]
  rankCols.forEach((c, i) => { wsRank.getColumn(i + 1).width = c.width })

  const rankTotalCols = rankCols.length
  const rankStart = buildHeader(wsRank, 'Ranking Performa Farm', 'Diurutkan berdasarkan Health Score tertinggi', rankTotalCols, [
    { label: 'Farm Terbaik',  value: farmDetails.sort((a, b) => b.health - a.health)[0]?.nama ?? '—', argb: C.moss  },
    { label: 'Health Score',  value: `${farmDetails[0]?.health ?? 0}%`,                                argb: C.moss  },
    { label: 'Avg Mortality', value: `${avgMortality}%`,                                               argb: avgMortality > 15 ? C.red : avgMortality > 7 ? C.amber : C.moss },
  ])

  buildTableHeader(wsRank, rankStart, rankCols.map(c => c.label))

  const ranked = [...farmDetails].sort((a, b) => b.health - a.health)

  ranked.forEach((farm, i) => {
    const rowNum = rankStart + 1 + i
    const even   = i % 2 === 0
    const rowFill = solid(even ? C.rowAlt : C.white)

    wsRank.getRow(rowNum).height = 22

    // Rank medal
    const medalArgb = i === 0 ? 'FFC7873E' : i === 1 ? 'FF9B9B9B' : i === 2 ? 'FFC67B3A' : C.muted
    setCell(wsRank.getRow(rowNum).getCell(1), i + 1, {
      font:  { name: 'Calibri', size: 14, bold: true, color: { argb: medalArgb } },
      fill:  rowFill, align: CENTER, border: thinBorder(),
    })

    setCell(wsRank.getRow(rowNum).getCell(2), farm.nama, {
      font:  { name: 'Calibri', size: 11, bold: true, color: { argb: C.forest } },
      fill:  rowFill, align: LEFT, border: thinBorder(),
    })

    applyStatusCell(wsRank.getRow(rowNum).getCell(3), farm.status)

    setCell(wsRank.getRow(rowNum).getCell(4), farm.aktif, {
      font:  { name: 'Calibri', size: 12, bold: true, color: { argb: C.forest } },
      fill:  rowFill, align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    const ms2 = mortalityStyle(farm.mortality)
    setCell(wsRank.getRow(rowNum).getCell(5), farm.mati, {
      font:  { name: 'Calibri', size: 12, color: { argb: farm.mati > 0 ? C.red : C.muted } },
      fill:  farm.mati > 0 ? solid(C.redFill) : rowFill,
      align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    setCell(wsRank.getRow(rowNum).getCell(6), farm.mortality, {
      font:  { name: 'Calibri', size: 12, bold: true, color: { argb: ms2.font } },
      fill:  solid(ms2.fill), align: CENTER, border: thinBorder(), numFmt: '0"%"',
    })

    const hs2 = healthStyle(farm.health)
    setCell(wsRank.getRow(rowNum).getCell(7), farm.health, {
      font:  { name: 'Calibri', size: 13, bold: true, color: { argb: hs2.font } },
      fill:  solid(hs2.fill), align: CENTER, border: thinBorder(), numFmt: '0"%"',
    })

    setCell(wsRank.getRow(rowNum).getCell(8), farm.totalMedis, {
      font:  { name: 'Calibri', size: 11, color: { argb: C.moss } },
      fill:  rowFill, align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })

    setCell(wsRank.getRow(rowNum).getCell(9), farm._count.members, {
      font:  { name: 'Calibri', size: 11, color: { argb: C.forest } },
      fill:  rowFill, align: CENTER, border: thinBorder(), numFmt: '#,##0',
    })
  })

  // ── Serialize ─────────────────────────────────────────────────────────────
  const buf  = await wb.xlsx.writeBuffer()
  const date = new Date().toISOString().split('T')[0]
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  return new NextResponse(blob, {
    headers: {
      'Content-Disposition': `attachment; filename="KostaHub-Laporan-Regional-${date}.xlsx"`,
      'Cache-Control':       'no-store',
    },
  })
}
