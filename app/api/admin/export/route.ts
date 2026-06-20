/**
 * KostaHub Admin Excel Export
 * Uses ExcelJS for full rich styling support.
 *
 * Template design:
 *  - Cover sheet with KPI summary
 *  - Per-entity data sheet with branded header, stats bar, styled table, totals
 *  - Frozen header row, auto-filter, per-column alignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  /** Dark forest background — used for report header */
  forest:   '1B2A1F',
  /** Slightly lighter forest */
  forestMid:'243326',
  /** Ochre brand accent */
  ochre:    'C7873E',
  /** Warm cream — text on dark */
  cream:    'F2EDE0',
  /** Moss green — positive / AKTIF */
  moss:     '3F5B3A',
  /** Sage light fill for positive cells */
  sageFill: 'D6EACC',
  /** Strong red — negative / MATI */
  red:      'B5443B',
  /** Light red fill */
  redFill:  'FADADD',
  /** Amber/golden — PENDING / TERJUAL label */
  amber:    '8B6500',
  /** Amber fill */
  amberFill:'FFF4C2',
  /** Deep blue — info */
  blue:     '1A4E8B',
  /** Blue fill */
  blueFill: 'DDEEFF',
  /** Table header background */
  tableHdr: '2D4A32',
  /** Alternating row A (white) */
  rowA:     'FFFFFF',
  /** Alternating row B (very light sage) */
  rowB:     'F3F7F1',
  /** Totals row background */
  totals:   'EBF0E8',
  /** Thin border color */
  border:   'C8D5C4',
  /** Thick border (header-data separator) */
  borderHvy:'3F5B3A',
  /** Light muted text */
  muted:    '718070',
}

// ─────────────────────────────────────────────────────────────────────────────
// Font presets
// ─────────────────────────────────────────────────────────────────────────────

type XLFont = Partial<ExcelJS.Font>

const F = {
  brand: (sz = 18): XLFont =>
    ({ name: 'Calibri', size: sz, bold: true, color: { argb: `FF${T.cream}` } }),
  accent: (sz = 13): XLFont =>
    ({ name: 'Calibri', size: sz, bold: true, color: { argb: `FF${T.ochre}` } }),
  tableHdr: (): XLFont =>
    ({ name: 'Calibri', size: 10, bold: true, color: { argb: `FF${T.cream}` } }),
  body: (sz = 10): XLFont =>
    ({ name: 'Calibri', size: sz, color: { argb: 'FF1B2A1F' } }),
  muted: (sz = 9): XLFont =>
    ({ name: 'Calibri', size: sz, italic: true, color: { argb: `FF${T.muted}` } }),
  mono: (sz = 9): XLFont =>
    ({ name: 'Courier New', size: sz, color: { argb: `FF${T.muted}` } }),
  kpi: (sz = 20): XLFont =>
    ({ name: 'Calibri', size: sz, bold: true, color: { argb: 'FF1B2A1F' } }),
  kpiLabel: (): XLFont =>
    ({ name: 'Calibri', size: 8, color: { argb: `FF${T.muted}` } }),
  totals: (sz = 10): XLFont =>
    ({ name: 'Calibri', size: sz, bold: true, color: { argb: 'FF1B2A1F' } }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Border helpers
// ─────────────────────────────────────────────────────────────────────────────

type XLBorder = Partial<ExcelJS.Borders>

const border = {
  thin: (): XLBorder => ({
    top:    { style: 'thin',   color: { argb: `FF${T.border}` } },
    bottom: { style: 'thin',   color: { argb: `FF${T.border}` } },
    left:   { style: 'thin',   color: { argb: `FF${T.border}` } },
    right:  { style: 'thin',   color: { argb: `FF${T.border}` } },
  }),
  header: (): XLBorder => ({
    bottom: { style: 'medium', color: { argb: `FF${T.ochre}` } },
    left:   { style: 'thin',   color: { argb: `FF${T.border}` } },
    right:  { style: 'thin',   color: { argb: `FF${T.border}` } },
  }),
  totals: (): XLBorder => ({
    top:    { style: 'medium', color: { argb: `FF${T.borderHvy}` } },
    bottom: { style: 'double', color: { argb: `FF${T.borderHvy}` } },
    left:   { style: 'thin',   color: { argb: `FF${T.border}` } },
    right:  { style: 'thin',   color: { argb: `FF${T.border}` } },
  }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Fill helpers
// ─────────────────────────────────────────────────────────────────────────────

const fill = {
  solid: (hex: string): ExcelJS.Fill => ({
    type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${hex}` },
  }),
  none: (): ExcelJS.Fill => ({
    type: 'pattern', pattern: 'none',
  }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Alignment helpers
// ─────────────────────────────────────────────────────────────────────────────

const al = {
  center:  (): Partial<ExcelJS.Alignment> => ({ horizontal: 'center', vertical: 'middle' }),
  left:    (): Partial<ExcelJS.Alignment> => ({ horizontal: 'left',   vertical: 'middle' }),
  right:   (): Partial<ExcelJS.Alignment> => ({ horizontal: 'right',  vertical: 'middle' }),
  wrap:    (): Partial<ExcelJS.Alignment> => ({ horizontal: 'left',   vertical: 'middle', wrapText: true }),
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers to build report header block (rows 1-5)
// ─────────────────────────────────────────────────────────────────────────────

interface HeaderOptions {
  title: string
  subtitle: string
  totalCols: number
  stats: { label: string; value: string | number; color?: string }[]
}

function buildReportHeader(ws: ExcelJS.Worksheet, opts: HeaderOptions) {
  const { title, subtitle, totalCols, stats } = opts
  const lastCol = totalCols

  ws.properties.defaultRowHeight = 18

  // ── Row 1: Dark banner ────────────────────────────────────────────────────
  ws.getRow(1).height = 36
  const r1 = ws.getRow(1)
  r1.getCell(1).value = 'KostaHub'
  r1.getCell(1).font  = F.brand(20)
  r1.getCell(1).fill  = fill.solid(T.forest)
  r1.getCell(1).alignment = al.left()

  // Right side: system label
  const sysCell = r1.getCell(lastCol)
  sysCell.value     = 'SISTEM MANAJEMEN PETERNAKAN REGIONAL'
  sysCell.font      = F.muted(8)
  sysCell.fill      = fill.solid(T.forest)
  sysCell.alignment = { horizontal: 'right', vertical: 'middle' }

  // Fill middle cells of row 1 with same background
  for (let c = 2; c < lastCol; c++) {
    const cell = r1.getCell(c)
    cell.fill = fill.solid(T.forest)
  }
  ws.mergeCells(1, 1, 1, Math.max(1, lastCol - 1))

  // ── Row 2: Title bar ──────────────────────────────────────────────────────
  ws.getRow(2).height = 30
  const r2 = ws.getRow(2)
  r2.getCell(1).value = title
  r2.getCell(1).font  = F.accent(16)
  r2.getCell(1).fill  = fill.solid(T.forestMid)
  r2.getCell(1).alignment = al.left()
  for (let c = 2; c <= lastCol; c++) {
    r2.getCell(c).fill = fill.solid(T.forestMid)
  }
  ws.mergeCells(2, 1, 2, lastCol)

  // ── Row 3: Subtitle / date ────────────────────────────────────────────────
  ws.getRow(3).height = 20
  const r3 = ws.getRow(3)
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  r3.getCell(1).value = `${subtitle}   ·   Diekspor pada: ${dateStr}`
  r3.getCell(1).font  = F.muted(9)
  r3.getCell(1).fill  = fill.solid(T.moss)
  r3.getCell(1).font  = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FFCDE3CD' } }
  r3.getCell(1).alignment = al.left()
  for (let c = 2; c <= lastCol; c++) {
    r3.getCell(c).fill = fill.solid(T.moss)
  }
  ws.mergeCells(3, 1, 3, lastCol)

  // ── Row 4: KPI bar (split into equal columns) ─────────────────────────────
  ws.getRow(4).height = 14  // spacer
  for (let c = 1; c <= lastCol; c++) {
    ws.getRow(4).getCell(c).fill = fill.solid('F0F4EE')
  }

  // ── Row 5: KPI values (distribute across columns proportionally) ──────────
  ws.getRow(5).height = 48
  ws.getRow(6).height = 20

  // Distribute stats evenly across available columns
  const kpiCols = Math.min(stats.length, lastCol)
  const span = Math.floor(lastCol / kpiCols)

  stats.forEach((stat, i) => {
    const startCol = i * span + 1
    const endCol   = i === stats.length - 1 ? lastCol : (i + 1) * span

    const kpiCell = ws.getRow(5).getCell(startCol)
    kpiCell.value = stat.value
    kpiCell.font  = { name: 'Calibri', size: 22, bold: true, color: { argb: `FF${stat.color ?? T.forest}` } }
    kpiCell.fill  = fill.solid('F0F4EE')
    kpiCell.alignment = { horizontal: 'center', vertical: 'bottom' }

    const lblCell = ws.getRow(6).getCell(startCol)
    lblCell.value = stat.label.toUpperCase()
    lblCell.font  = { name: 'Calibri', size: 8, color: { argb: `FF${T.muted}` }, bold: true }
    lblCell.fill  = fill.solid('F0F4EE')
    lblCell.alignment = { horizontal: 'center', vertical: 'top' }

    if (endCol > startCol) {
      ws.mergeCells(5, startCol, 5, endCol)
      ws.mergeCells(6, startCol, 6, endCol)
    }

    // Add right divider between KPIs
    if (i < stats.length - 1) {
      ws.getRow(5).getCell(endCol).border = {
        right: { style: 'thin', color: { argb: `FF${T.border}` } },
      }
    }
  })

  // ── Row 7: Thin separator line ────────────────────────────────────────────
  ws.getRow(7).height = 6
  for (let c = 1; c <= lastCol; c++) {
    const cell = ws.getRow(7).getCell(c)
    cell.fill   = fill.solid(T.ochre)
  }

  return 8 // data starts at row 8
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply table header style at given row
// ─────────────────────────────────────────────────────────────────────────────

function applyTableHeader(ws: ExcelJS.Worksheet, row: number, headers: string[]) {
  const r = ws.getRow(row)
  r.height = 26

  headers.forEach((h, i) => {
    const cell = r.getCell(i + 1)
    cell.value     = h.toUpperCase()
    cell.font      = F.tableHdr()
    cell.fill      = fill.solid(T.tableHdr)
    cell.alignment = al.center()
    cell.border    = border.header()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply alternating row style
// ─────────────────────────────────────────────────────────────────────────────

function applyDataRow(ws: ExcelJS.Worksheet, rowNum: number, colCount: number, isEven: boolean) {
  const r = ws.getRow(rowNum)
  r.height = 20
  for (let c = 1; c <= colCount; c++) {
    const cell = r.getCell(c)
    cell.fill   = fill.solid(isEven ? T.rowB : T.rowA)
    cell.border = border.thin()
    if (!cell.font || !cell.font.name) cell.font = F.body()
    cell.alignment = cell.alignment ?? al.left()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply totals row style
// ─────────────────────────────────────────────────────────────────────────────

function applyTotalsRow(ws: ExcelJS.Worksheet, rowNum: number, colCount: number) {
  const r = ws.getRow(rowNum)
  r.height = 24
  for (let c = 1; c <= colCount; c++) {
    const cell = r.getCell(c)
    cell.fill   = fill.solid(T.totals)
    cell.border = border.totals()
    if (!cell.font || !cell.font.bold) cell.font = F.totals()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge helper — returns styled cell config
// ─────────────────────────────────────────────────────────────────────────────

interface StatusStyle { text: string; fill: string; font: string }

function statusStyle(raw: string): StatusStyle {
  const map: Record<string, StatusStyle> = {
    AKTIF:    { text: 'AKTIF',    fill: T.sageFill, font: T.moss  },
    APPROVED: { text: 'AKTIF',    fill: T.sageFill, font: T.moss  },
    MATI:     { text: 'MATI',     fill: T.redFill,  font: T.red   },
    REJECTED: { text: 'DITOLAK',  fill: T.redFill,  font: T.red   },
    TERJUAL:  { text: 'TERJUAL',  fill: T.blueFill, font: T.blue  },
    PENDING:  { text: 'PENDING',  fill: T.amberFill,font: T.amber },
    NONAKTIF: { text: 'NONAKTIF', fill: T.redFill,  font: T.red   },
  }
  return map[raw] ?? { text: raw, fill: 'FFFFFF', font: T.forest }
}

function applyStatus(cell: ExcelJS.Cell, raw: string) {
  const s = statusStyle(raw)
  cell.value     = s.text
  cell.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: `FF${s.font}` } }
  cell.fill      = fill.solid(s.fill)
  cell.alignment = al.center()
}

// ─────────────────────────────────────────────────────────────────────────────
// Cover sheet builder
// ─────────────────────────────────────────────────────────────────────────────

interface CoverData {
  totalFarm: number; farmAktif: number
  totalUser: number; totalHewan: number
  exportedAt: string; exportedBy: string
}

function buildCoverSheet(wb: ExcelJS.Workbook, data: CoverData) {
  const ws = wb.addWorksheet('Ringkasan', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    views: [{ showGridLines: false }],
  })
  ws.properties.defaultColWidth = 18

  // Cover background
  ws.getColumn(1).width = 4
  ws.getColumn(2).width = 30
  ws.getColumn(3).width = 22
  ws.getColumn(4).width = 22
  ws.getColumn(5).width = 22
  ws.getColumn(6).width = 4

  // Row 1-2: Top padding
  ws.getRow(1).height = 20
  ws.getRow(2).height = 20

  // Row 3: Brand bar
  ws.getRow(3).height = 50
  ws.mergeCells('B3:E3')
  const brand = ws.getCell('B3')
  brand.value = 'KostaHub'
  brand.font  = { name: 'Calibri', bold: true, size: 32, color: { argb: `FF${T.forest}` } }
  brand.alignment = { horizontal: 'center', vertical: 'middle' }

  // Row 4: Tagline
  ws.getRow(4).height = 24
  ws.mergeCells('B4:E4')
  const tag = ws.getCell('B4')
  tag.value = 'Sistem Manajemen Peternakan Regional'
  tag.font  = { name: 'Calibri', size: 13, italic: true, color: { argb: `FF${T.ochre}` } }
  tag.alignment = { horizontal: 'center', vertical: 'middle' }

  // Row 5: Ochre divider
  ws.getRow(5).height = 5
  for (const col of ['B', 'C', 'D', 'E']) {
    ws.getCell(`${col}5`).fill = fill.solid(T.ochre)
  }

  // Row 6: Spacer
  ws.getRow(6).height = 16

  // Row 7: "LAPORAN EKSPOR" label
  ws.getRow(7).height = 28
  ws.mergeCells('B7:E7')
  const rptLabel = ws.getCell('B7')
  rptLabel.value     = 'LAPORAN EKSPOR DATA'
  rptLabel.font      = { name: 'Calibri', size: 11, bold: true, color: { argb: `FF${T.muted}` } }
  rptLabel.alignment = { horizontal: 'center', vertical: 'middle' }
  rptLabel.fill      = fill.solid('F3F7F1')

  // Rows 8-9: Export meta
  const meta = [
    ['Diekspor pada', data.exportedAt],
    ['Oleh (Super Admin)', data.exportedBy],
  ]
  meta.forEach(([label, val], i) => {
    const row = 8 + i
    ws.getRow(row).height = 22
    ws.mergeCells(row, 2, row, 3)
    const lCell = ws.getCell(row, 2)
    lCell.value     = label
    lCell.font      = { name: 'Calibri', size: 10, color: { argb: `FF${T.muted}` } }
    lCell.fill      = fill.solid('FAFAFA')
    lCell.alignment = al.left()

    ws.mergeCells(row, 4, row, 5)
    const vCell = ws.getCell(row, 4)
    vCell.value     = val
    vCell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: `FF${T.forest}` } }
    vCell.fill      = fill.solid('FAFAFA')
    vCell.alignment = al.left()
  })

  // Row 11: Spacer
  ws.getRow(11).height = 16

  // Row 12: KPI header
  ws.getRow(12).height = 20
  ws.mergeCells('B12:E12')
  const kpiHdr = ws.getCell('B12')
  kpiHdr.value     = 'RINGKASAN DATA'
  kpiHdr.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: `FF${T.cream}` } }
  kpiHdr.fill      = fill.solid(T.tableHdr)
  kpiHdr.alignment = { horizontal: 'center', vertical: 'middle' }

  // Rows 13-14: KPI cards (2 columns x 2 rows)
  const kpis = [
    { label: 'Total Farm',  value: data.totalFarm,  col: 'B', accent: T.forest },
    { label: 'Farm Aktif',  value: data.farmAktif,  col: 'C', accent: T.moss   },
    { label: 'Total User',  value: data.totalUser,  col: 'D', accent: T.blue   },
    { label: 'Total Hewan', value: data.totalHewan, col: 'E', accent: T.ochre  },
  ]

  kpis.forEach(kpi => {
    ws.getRow(13).height = 38
    ws.getRow(14).height = 18
    const vCell = ws.getCell(`${kpi.col}13`)
    vCell.value     = kpi.value
    vCell.font      = { name: 'Calibri', size: 26, bold: true, color: { argb: `FF${kpi.accent}` } }
    vCell.fill      = fill.solid('F3F7F1')
    vCell.alignment = { horizontal: 'center', vertical: 'bottom' }
    vCell.border    = { left: { style: 'thin', color: { argb: `FF${T.border}` } } }

    const lCell = ws.getCell(`${kpi.col}14`)
    lCell.value     = kpi.label.toUpperCase()
    lCell.font      = { name: 'Calibri', size: 8, color: { argb: `FF${T.muted}` } }
    lCell.fill      = fill.solid('F3F7F1')
    lCell.alignment = { horizontal: 'center', vertical: 'top' }
    lCell.border    = {
      bottom: { style: 'medium', color: { argb: `FF${T.borderHvy}` } },
      left:   { style: 'thin',   color: { argb: `FF${T.border}` } },
    }
  })

  // Row 15: Spacer + Bottom note
  ws.getRow(16).height = 14
  ws.mergeCells('B16:E16')
  const note = ws.getCell('B16')
  note.value     = 'Dokumen ini digenerate secara otomatis oleh sistem KostaHub. Hanya untuk keperluan internal.'
  note.font      = { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF9FAF9F' } }
  note.alignment = { horizontal: 'center', vertical: 'middle' }

  return ws
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = req.nextUrl.searchParams.get('type') ?? 'farms'

  const wb = new ExcelJS.Workbook()
  wb.creator  = 'KostaHub System'
  wb.lastModifiedBy = session.name ?? 'Super Admin'
  wb.created  = new Date()
  wb.modified = new Date()
  wb.properties.date1904 = false

  // ── Shared data for cover ─────────────────────────────────────────────────
  const [farmCount, farmAktifCount, userCount, hewanCount] = await Promise.all([
    prisma.farm.count(),
    prisma.farm.count({ where: { status: 'AKTIF' } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.hewan.count({ where: { status: 'AKTIF' } }),
  ])

  const coverData: CoverData = {
    totalFarm:  farmCount,
    farmAktif:  farmAktifCount,
    totalUser:  userCount,
    totalHewan: hewanCount,
    exportedAt: new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    exportedBy: session.name ?? 'Super Admin',
  }

  // ── Cover sheet (always included) ────────────────────────────────────────
  buildCoverSheet(wb, coverData)

  // ─────────────────────────────────────────────────────────────────────────
  // FARM SHEET
  // ─────────────────────────────────────────────────────────────────────────
  if (type === 'farms' || type === 'all') {
    const farms = await prisma.farm.findMany({
      select: {
        id: true, nama: true, alamat: true, status: true,
        lat: true, lng: true, createdAt: true,
        _count: { select: { hewan: true, members: true } },
        members: {
          where: { user: { role: 'OWNER', deletedAt: null } },
          take: 1,
          select: { user: { select: { name: true, email: true, phone: true } } },
        },
      },
      orderBy: { status: 'asc' },
    })

    const aktif   = farms.filter(f => f.status === 'AKTIF').length
    const nonaktif= farms.filter(f => f.status !== 'AKTIF').length
    const totalHw = farms.reduce((s, f) => s + f._count.hewan, 0)
    const totalMb = farms.reduce((s, f) => s + f._count.members, 0)

    const ws = wb.addWorksheet('Data Farm', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
    })

    // Column widths
    const cols = [
      { width: 5,  header: 'No'            },
      { width: 14, header: 'ID Farm'        },
      { width: 28, header: 'Nama Farm'      },
      { width: 24, header: 'Nama Owner'     },
      { width: 30, header: 'Email Owner'    },
      { width: 18, header: 'No. HP Owner'   },
      { width: 35, header: 'Alamat'         },
      { width: 12, header: 'Status'         },
      { width: 11, header: 'Latitude'       },
      { width: 11, header: 'Longitude'      },
      { width: 11, header: 'Jml Hewan'      },
      { width: 11, header: 'Jml Member'     },
      { width: 16, header: 'Tgl Daftar'     },
    ]
    cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.width })

    const dataStart = buildReportHeader(ws, {
      title:     'Laporan Data Farm',
      subtitle:  `Total: ${farms.length} farm terdaftar`,
      totalCols: cols.length,
      stats: [
        { label: 'Total Farm',    value: farms.length, color: T.forest },
        { label: 'Farm Aktif',    value: aktif,         color: T.moss   },
        { label: 'Farm Nonaktif', value: nonaktif,       color: T.red    },
        { label: 'Total Hewan',   value: totalHw,        color: T.ochre  },
        { label: 'Total Member',  value: totalMb,        color: T.blue   },
      ],
    })

    applyTableHeader(ws, dataStart, cols.map(c => c.header))
    ws.autoFilter = {
      from: { row: dataStart, column: 1 },
      to:   { row: dataStart, column: cols.length },
    }

    farms.forEach((f, i) => {
      const rowNum = dataStart + 1 + i
      const isEven = i % 2 === 0
      const owner  = f.members[0]?.user

      applyDataRow(ws, rowNum, cols.length, isEven)
      const r = ws.getRow(rowNum)

      // No
      r.getCell(1).value     = i + 1
      r.getCell(1).font      = { name: 'Calibri', size: 9, color: { argb: `FF${T.muted}` } }
      r.getCell(1).alignment = al.center()
      // ID
      r.getCell(2).value     = f.id
      r.getCell(2).font      = F.mono()
      r.getCell(2).alignment = al.left()
      // Nama Farm
      r.getCell(3).value     = f.nama
      r.getCell(3).font      = { name: 'Calibri', size: 10, bold: true, color: { argb: `FF${T.forest}` } }
      // Owner name
      r.getCell(4).value     = owner?.name ?? '—'
      r.getCell(4).font      = F.body()
      r.getCell(4).alignment = al.left()
      // Owner email
      r.getCell(5).value     = owner?.email ?? '—'
      r.getCell(5).font      = { name: 'Calibri', size: 10, color: { argb: `FF${T.blue}` } }
      r.getCell(5).alignment = al.left()
      // Owner phone
      r.getCell(6).value     = owner?.phone ?? '—'
      r.getCell(6).font      = F.body()
      r.getCell(6).alignment = al.left()
      // Alamat
      r.getCell(7).value     = f.alamat ?? '—'
      r.getCell(7).font      = F.body()
      r.getCell(7).alignment = al.wrap()
      // Status
      applyStatus(r.getCell(8), f.status)
      // Lat / Lng
      ;[9, 10].forEach((col, idx) => {
        const val = idx === 0 ? f.lat : f.lng
        r.getCell(col).value     = val ?? '—'
        r.getCell(col).font      = F.mono()
        r.getCell(col).alignment = al.center()
        r.getCell(col).numFmt    = typeof val === 'number' ? '0.000000' : '@'
      })
      // Counts
      r.getCell(11).value     = f._count.hewan
      r.getCell(11).font      = { name: 'Calibri', size: 11, bold: true, color: { argb: `FF${T.forest}` } }
      r.getCell(11).alignment = al.center()
      r.getCell(11).numFmt    = '#,##0'

      r.getCell(12).value     = f._count.members
      r.getCell(12).font      = F.body()
      r.getCell(12).alignment = al.center()
      // Date
      r.getCell(13).value     = f.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      r.getCell(13).font      = F.body()
      r.getCell(13).alignment = al.center()
    })

    // Totals row
    const totalsRow = dataStart + 1 + farms.length
    applyTotalsRow(ws, totalsRow, cols.length)
    const tr = ws.getRow(totalsRow)
    tr.getCell(1).value = ''
    tr.getCell(2).value = ''
    ws.mergeCells(totalsRow, 1, totalsRow, 3)
    const totLbl = tr.getCell(1)
    totLbl.value     = `TOTAL — ${farms.length} FARM`
    totLbl.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: `FF${T.muted}` } }
    totLbl.alignment = al.left()

    tr.getCell(11).value  = totalHw
    tr.getCell(11).numFmt = '#,##0'
    tr.getCell(11).alignment = al.center()

    tr.getCell(12).value  = totalMb
    tr.getCell(12).numFmt = '#,##0'
    tr.getCell(12).alignment = al.center()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER SHEET
  // ─────────────────────────────────────────────────────────────────────────
  if (type === 'users' || type === 'all') {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        approvalStatus: true, createdAt: true,
        farms: {
          take: 1,
          select: { farm: { select: { nama: true, status: true } } },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    })

    const ROLE_LABEL: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin', OWNER: 'Owner', PETUGAS: 'Petugas', DOKTER: 'Dokter',
    }

    const totalApproved = users.filter(u => u.approvalStatus === 'APPROVED').length
    const totalPending  = users.filter(u => u.approvalStatus === 'PENDING').length
    const totalRejected = users.filter(u => u.approvalStatus === 'REJECTED').length

    const ws = wb.addWorksheet('Data User', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
      views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
    })

    const cols = [
      { width: 5,  header: 'No'           },
      { width: 14, header: 'ID User'       },
      { width: 26, header: 'Nama'          },
      { width: 30, header: 'Email'         },
      { width: 16, header: 'No. HP'        },
      { width: 14, header: 'Role'          },
      { width: 13, header: 'Status Akun'   },
      { width: 26, header: 'Farm'          },
      { width: 13, header: 'Status Farm'   },
      { width: 16, header: 'Tgl Daftar'   },
    ]
    cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.width })

    const dataStart = buildReportHeader(ws, {
      title:    'Laporan Data User',
      subtitle: `Total: ${users.length} user terdaftar`,
      totalCols: cols.length,
      stats: [
        { label: 'Total User',     value: users.length, color: T.forest },
        { label: 'Akun Disetujui', value: totalApproved, color: T.moss  },
        { label: 'Akun Pending',   value: totalPending,  color: T.amber },
        { label: 'Akun Ditolak',   value: totalRejected, color: T.red   },
      ],
    })

    applyTableHeader(ws, dataStart, cols.map(c => c.header))
    ws.autoFilter = {
      from: { row: dataStart, column: 1 },
      to:   { row: dataStart, column: cols.length },
    }

    users.forEach((u, i) => {
      const rowNum = dataStart + 1 + i
      const farm   = u.farms[0]?.farm
      applyDataRow(ws, rowNum, cols.length, i % 2 === 0)
      const r = ws.getRow(rowNum)

      r.getCell(1).value     = i + 1
      r.getCell(1).font      = { name: 'Calibri', size: 9, color: { argb: `FF${T.muted}` } }
      r.getCell(1).alignment = al.center()

      r.getCell(2).value     = u.id
      r.getCell(2).font      = F.mono()

      r.getCell(3).value     = u.name
      r.getCell(3).font      = { name: 'Calibri', size: 10, bold: true, color: { argb: `FF${T.forest}` } }

      r.getCell(4).value     = u.email
      r.getCell(4).font      = { name: 'Calibri', size: 10, color: { argb: `FF${T.blue}` } }

      r.getCell(5).value     = u.phone ?? '—'
      r.getCell(5).font      = F.body()
      r.getCell(5).alignment = al.center()

      // Role badge
      const role = ROLE_LABEL[u.role] ?? u.role
      const roleColors: Record<string, { fill: string; font: string }> = {
        'Super Admin': { fill: T.forest, font: T.cream },
        'Owner':       { fill: 'FFF0E0', font: 'A05C00' },
        'Petugas':     { fill: 'E8F5E9', font: '2E7D32' },
        'Dokter':      { fill: 'E3F2FD', font: '0D47A1' },
      }
      const rc = roleColors[role] ?? { fill: 'F5F5F5', font: T.muted }
      r.getCell(6).value     = role
      r.getCell(6).font      = { name: 'Calibri', size: 9, bold: true, color: { argb: `FF${rc.font}` } }
      r.getCell(6).fill      = fill.solid(rc.fill)
      r.getCell(6).alignment = al.center()

      applyStatus(r.getCell(7), u.approvalStatus)

      r.getCell(8).value     = farm?.nama ?? '—'
      r.getCell(8).font      = F.body()

      if (farm) applyStatus(r.getCell(9), farm.status)
      else {
        r.getCell(9).value     = '—'
        r.getCell(9).alignment = al.center()
      }

      r.getCell(10).value     = u.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      r.getCell(10).font      = F.body()
      r.getCell(10).alignment = al.center()
    })

    // Totals
    const totalsRow = dataStart + 1 + users.length
    applyTotalsRow(ws, totalsRow, cols.length)
    const tr = ws.getRow(totalsRow)
    ws.mergeCells(totalsRow, 1, totalsRow, 4)
    tr.getCell(1).value     = `TOTAL — ${users.length} USER`
    tr.getCell(1).font      = { name: 'Calibri', size: 9, bold: true, color: { argb: `FF${T.muted}` } }
    tr.getCell(1).alignment = al.left()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HEWAN SHEET
  // ─────────────────────────────────────────────────────────────────────────
  if (type === 'hewan' || type === 'all') {
    const hewan = await prisma.hewan.findMany({
      select: {
        id: true, tag: true, nama: true, kelamin: true,
        tanggalLahir: true, berat: true, kategori: true, status: true,
        farm: { select: { nama: true } },
        createdAt: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 5000,
    })

    const KATEGORI: Record<string, string> = {
      INDUKAN: 'Indukan', PEJANTAN: 'Pejantan', ANAKAN: 'Anakan',
      DARA: 'Dara', JANTAN_MUDA: 'Jantan Muda',
    }
    const KELAMIN: Record<string, string> = { JANTAN: 'Jantan ♂', BETINA: 'Betina ♀' }

    const totalAktif  = hewan.filter(h => h.status === 'AKTIF').length
    const totalMati   = hewan.filter(h => h.status === 'MATI').length
    const totalTerjual= hewan.filter(h => h.status === 'TERJUAL').length
    const avgBerat    = hewan.length
      ? (hewan.reduce((s, h) => s + (h.berat ?? 0), 0) / hewan.length).toFixed(1)
      : 0

    const ws = wb.addWorksheet('Data Hewan', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
      views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
    })

    const cols = [
      { width: 5,  header: 'No'          },
      { width: 14, header: 'ID'           },
      { width: 14, header: 'Tag'          },
      { width: 20, header: 'Nama'         },
      { width: 12, header: 'Kelamin'      },
      { width: 14, header: 'Kategori'     },
      { width: 14, header: 'Tgl Lahir'   },
      { width: 12, header: 'Berat (kg)'   },
      { width: 12, header: 'Status'       },
      { width: 26, header: 'Farm'         },
      { width: 16, header: 'Tgl Daftar'  },
    ]
    cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.width })

    const dataStart = buildReportHeader(ws, {
      title:    'Laporan Data Hewan',
      subtitle: `Total: ${hewan.length} hewan (maks. 5.000 record)`,
      totalCols: cols.length,
      stats: [
        { label: 'Total Hewan', value: hewan.length,  color: T.forest },
        { label: 'Aktif',       value: totalAktif,    color: T.moss   },
        { label: 'Mati',        value: totalMati,     color: T.red    },
        { label: 'Terjual',     value: totalTerjual,  color: T.blue   },
        { label: 'Rata Berat',  value: `${avgBerat} kg`, color: T.ochre },
      ],
    })

    applyTableHeader(ws, dataStart, cols.map(c => c.header))
    ws.autoFilter = {
      from: { row: dataStart, column: 1 },
      to:   { row: dataStart, column: cols.length },
    }

    hewan.forEach((h, i) => {
      const rowNum = dataStart + 1 + i
      applyDataRow(ws, rowNum, cols.length, i % 2 === 0)
      const r = ws.getRow(rowNum)

      r.getCell(1).value     = i + 1
      r.getCell(1).font      = { name: 'Calibri', size: 9, color: { argb: `FF${T.muted}` } }
      r.getCell(1).alignment = al.center()

      r.getCell(2).value     = h.id
      r.getCell(2).font      = F.mono()

      r.getCell(3).value     = h.tag
      r.getCell(3).font      = { name: 'Courier New', size: 10, bold: true, color: { argb: `FF${T.ochre}` } }
      r.getCell(3).alignment = al.center()

      r.getCell(4).value     = h.nama ?? '—'
      r.getCell(4).font      = F.body()

      const kel = KELAMIN[h.kelamin] ?? h.kelamin
      r.getCell(5).value     = kel
      r.getCell(5).font      = {
        name: 'Calibri', size: 10, bold: true,
        color: { argb: h.kelamin === 'JANTAN' ? `FF${T.blue}` : `FF${T.red}` },
      }
      r.getCell(5).fill      = fill.solid(h.kelamin === 'JANTAN' ? T.blueFill : T.redFill)
      r.getCell(5).alignment = al.center()

      r.getCell(6).value     = KATEGORI[h.kategori] ?? h.kategori
      r.getCell(6).font      = F.body()
      r.getCell(6).alignment = al.center()

      r.getCell(7).value     = new Date(h.tanggalLahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      r.getCell(7).font      = F.body()
      r.getCell(7).alignment = al.center()

      r.getCell(8).value     = h.berat ?? 0
      r.getCell(8).numFmt    = '#,##0.0'
      r.getCell(8).font      = { name: 'Calibri', size: 10, color: { argb: `FF${T.forest}` } }
      r.getCell(8).alignment = al.right()

      applyStatus(r.getCell(9), h.status)

      r.getCell(10).value    = h.farm.nama
      r.getCell(10).font     = F.body()

      r.getCell(11).value    = h.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      r.getCell(11).font     = F.body()
      r.getCell(11).alignment= al.center()
    })

    // Totals row
    const totalsRow = dataStart + 1 + hewan.length
    applyTotalsRow(ws, totalsRow, cols.length)
    const tr = ws.getRow(totalsRow)
    ws.mergeCells(totalsRow, 1, totalsRow, 3)
    tr.getCell(1).value     = `TOTAL — ${hewan.length} HEWAN`
    tr.getCell(1).font      = { name: 'Calibri', size: 9, bold: true, color: { argb: `FF${T.muted}` } }
    tr.getCell(1).alignment = al.left()

    const totalBerat = hewan.reduce((s, h) => s + (h.berat ?? 0), 0)
    tr.getCell(8).value  = totalBerat
    tr.getCell(8).numFmt = '#,##0.0'
    tr.getCell(8).alignment = al.right()
  }

  if (!wb.worksheets.length) {
    return NextResponse.json({ error: 'Type tidak valid. Gunakan: farms, users, hewan, all' }, { status: 400 })
  }

  // ── Serialize ─────────────────────────────────────────────────────────────
  const buf      = await wb.xlsx.writeBuffer()
  const dateStr  = new Date().toISOString().split('T')[0]
  const label    = type === 'all' ? 'lengkap' : type
  const filename = `KostaHub-${label}-${dateStr}.xlsx`

  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  return new NextResponse(blob, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
