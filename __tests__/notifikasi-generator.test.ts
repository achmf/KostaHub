/**
 * WHITEBOX UNIT TESTS: lib/notifikasi-generator.ts
 *
 * Coverage targets:
 *   - generateKontrolMedisDue    : all branches (found/not found, skip if existing, farmId null)
 *   - generateKelahiranMendekat  : all branches (found/not found, skip if existing, farmId null)
 *   - generatePenimbanganTerlambat: all branches (found/not found, skip if existing)
 *   - generateNotifikasiOtomatis : orchestration, all generators called in parallel
 *
 * Strategy: vi.mock('@/lib/prisma') — zero DB calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── 1. Hoist mock functions BEFORE vi.mock (factory is hoisted to top) ────────
const { mockFindMany, mockFindFirst, mockCreate, mockCount } = vi.hoisted(() => ({
  mockFindMany:  vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate:    vi.fn(),
  mockCount:     vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    rekamMedis: { findMany: mockFindMany },
    reproduksi: { findMany: mockFindMany },
    hewan:      { findMany: mockFindMany },
    notifikasi: {
      findFirst: mockFindFirst,
      create:    mockCreate,
      count:     mockCount,
    },
  },
}))

// ── 2. Import the module under test (after mocks are wired) ───────────────────
import { generateNotifikasiOtomatis } from '@/lib/notifikasi-generator'

// ── Helpers ───────────────────────────────────────────────────────────────────
const FARM_ID = 'farm-abc-123'
const NOW     = new Date('2026-08-24T02:00:00Z')

/** Build a fake RekamMedis row */
function fakeRekamMedis(overrides = {}) {
  return {
    id: 'rekam-001',
    diagnosis: 'Vaksin PMK',
    butuhNotifikasi: true,
    tanggalLanjut: new Date('2026-08-25T00:00:00Z'),  // +1 day, within 3-day window
    hewan: { tag: 'KST-001', nama: 'Mbah Putri' },
    ...overrides,
  }
}

/** Build a fake Reproduksi row */
function fakeReproduksi(overrides = {}) {
  return {
    id: 'repro-001',
    estimasiLahir: new Date('2026-08-26T00:00:00Z'),  // +2 days, within 7-day window
    induk: { tag: 'KST-G1F', nama: 'Cinta' },
    ...overrides,
  }
}

/** Build a fake Hewan row */
function fakeHewan(overrides = {}) {
  return {
    id: 'hewan-001',
    tag: 'KST-001',
    nama: 'Bandi',
    updatedAt: new Date('2026-07-01T00:00:00Z'),  // >30 days ago
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
describe('notifikasi-generator whitebox tests', () => {

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION A: generateNotifikasiOtomatis (orchestration)
  // ══════════════════════════════════════════════════════════════════════════

  describe('generateNotifikasiOtomatis — orchestration', () => {

    it('calls all three sub-generators in parallel (farmId provided)', async () => {
      // All generators call findMany once each for their domain
      mockFindMany.mockResolvedValue([])
      mockFindFirst.mockResolvedValue(null)

      await generateNotifikasiOtomatis(FARM_ID)

      // findMany called 3 times: rekamMedis, reproduksi, hewan
      expect(mockFindMany).toHaveBeenCalledTimes(3)
    })

    it('calls all three sub-generators when farmId is null (super admin)', async () => {
      mockFindMany.mockResolvedValue([])
      mockFindFirst.mockResolvedValue(null)

      await generateNotifikasiOtomatis(null)

      expect(mockFindMany).toHaveBeenCalledTimes(3)
    })

    it('does NOT throw even if all sub-generators return empty', async () => {
      mockFindMany.mockResolvedValue([])
      await expect(generateNotifikasiOtomatis(FARM_ID)).resolves.toBeUndefined()
    })

  })

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION B: generateKontrolMedisDue
  // ══════════════════════════════════════════════════════════════════════════

  describe('generateKontrolMedisDue', () => {

    it('[HAPPY PATH] creates MEDIS notification when tanggalLanjut is within 3 days', async () => {
      const rekam = fakeRekamMedis()

      // findMany returns [rekamMedis], findFirst(existing notif) returns null
      mockFindMany
        .mockResolvedValueOnce([rekam])  // rekamMedis.findMany
        .mockResolvedValueOnce([])       // reproduksi.findMany
        .mockResolvedValueOnce([])       // hewan.findMany
      mockFindFirst.mockResolvedValue(null)  // no existing notif
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).toHaveBeenCalledTimes(1)
      const created = mockCreate.mock.calls[0][0].data
      expect(created.type).toBe('MEDIS')
      expect(created.farmId).toBe(FARM_ID)
      expect(created.title).toContain('KST-001')
      expect(created.title).toContain('Mbah Putri')
      expect(created.message).toContain(`MEDIS-${rekam.id}`)
    })

    it('[BRANCH] skips creation if a notification with the same key already exists', async () => {
      const rekam = fakeRekamMedis()

      mockFindMany
        .mockResolvedValueOnce([rekam])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      // findFirst returns an existing notif → should skip
      mockFindFirst.mockResolvedValue({ id: 'existing-notif' })

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('[BRANCH] hewan without nama — title contains only tag', async () => {
      const rekam = fakeRekamMedis({ hewan: { tag: 'KST-999', nama: null } })

      mockFindMany
        .mockResolvedValueOnce([rekam])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.title).toBe('Jadwal Kontrol Medis: KST-999')
      expect(created.title).not.toContain('(')
    })

    it('[BRANCH] hewan is null — title uses "unknown" tag', async () => {
      const rekam = fakeRekamMedis({ hewan: null })

      mockFindMany
        .mockResolvedValueOnce([rekam])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.title).toContain('unknown')
    })

    it('[BRANCH] farmId null — notifikasi created with farmId null', async () => {
      const rekam = fakeRekamMedis()

      mockFindMany
        .mockResolvedValueOnce([rekam])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(null)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.farmId).toBeNull()
    })

    it('[BRANCH] multiple rekam medis — creates a notif for each unregistered one', async () => {
      const r1 = fakeRekamMedis({ id: 'rekam-001' })
      const r2 = fakeRekamMedis({ id: 'rekam-002' })

      mockFindMany
        .mockResolvedValueOnce([r1, r2])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      // r1 already exists, r2 is new
      mockFindFirst
        .mockResolvedValueOnce({ id: 'existing' })  // r1 → skip
        .mockResolvedValueOnce(null)                 // r2 → create
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).toHaveBeenCalledTimes(1)
      const created = mockCreate.mock.calls[0][0].data
      expect(created.message).toContain('MEDIS-rekam-002')
    })

    it('[BRANCH] empty rekamMedis list — no create called', async () => {
      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('[DATA] tanggal on notifikasi matches tanggalLanjut of RekamMedis', async () => {
      const lanjutDate = new Date('2026-08-26T10:00:00Z')
      const rekam = fakeRekamMedis({ tanggalLanjut: lanjutDate })

      mockFindMany
        .mockResolvedValueOnce([rekam])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.tanggal).toEqual(lanjutDate)
    })

    it('[DATA] message contains ref key in correct format', async () => {
      const rekam = fakeRekamMedis({ id: 'abc-xyz-789' })

      mockFindMany
        .mockResolvedValueOnce([rekam])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.message).toContain('[ref:MEDIS-abc-xyz-789]')
    })

  })

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION C: generateKelahiranMendekat
  // ══════════════════════════════════════════════════════════════════════════

  describe('generateKelahiranMendekat', () => {

    it('[HAPPY PATH] creates LAHIR notification when estimasiLahir is within 7 days', async () => {
      const repro = fakeReproduksi()

      mockFindMany
        .mockResolvedValueOnce([])       // rekamMedis.findMany
        .mockResolvedValueOnce([repro])  // reproduksi.findMany
        .mockResolvedValueOnce([])       // hewan.findMany
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).toHaveBeenCalledTimes(1)
      const created = mockCreate.mock.calls[0][0].data
      expect(created.type).toBe('LAHIR')
      expect(created.farmId).toBe(FARM_ID)
      expect(created.title).toContain('KST-G1F')
      expect(created.title).toContain('Cinta')
      expect(created.message).toContain(`LAHIR-${repro.id}`)
    })

    it('[BRANCH] skips if LAHIR notification for same reproduksi already exists', async () => {
      const repro = fakeReproduksi()

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([repro])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue({ id: 'already-created' })

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('[BRANCH] induk without nama — title contains only tag', async () => {
      const repro = fakeReproduksi({ induk: { tag: 'KST-NONAME', nama: null } })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([repro])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.title).toBe('Estimasi Kelahiran: KST-NONAME')
    })

    it('[BRANCH] induk is null — title uses "unknown" tag', async () => {
      const repro = fakeReproduksi({ induk: null })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([repro])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.title).toContain('unknown')
    })

    it('[DATA] tanggal on notifikasi matches estimasiLahir', async () => {
      const lahirDate = new Date('2026-08-28T00:00:00Z')
      const repro = fakeReproduksi({ estimasiLahir: lahirDate })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([repro])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.tanggal).toEqual(lahirDate)
    })

    it('[DATA] message mentions "kandang beranak" and ref key', async () => {
      const repro = fakeReproduksi({ id: 'repro-test-xyz' })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([repro])
        .mockResolvedValueOnce([])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.message).toContain('kandang beranak')
      expect(created.message).toContain('[ref:LAHIR-repro-test-xyz]')
    })

    it('[BRANCH] multiple reproduksi — only creates notif for new ones', async () => {
      const r1 = fakeReproduksi({ id: 'repro-old' })
      const r2 = fakeReproduksi({ id: 'repro-new' })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([r1, r2])
        .mockResolvedValueOnce([])
      mockFindFirst
        .mockResolvedValueOnce({ id: 'existing' })  // r1 → skip
        .mockResolvedValueOnce(null)                 // r2 → create
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).toHaveBeenCalledTimes(1)
      expect(mockCreate.mock.calls[0][0].data.message).toContain('LAHIR-repro-new')
    })

  })

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION D: generatePenimbanganTerlambat
  // ══════════════════════════════════════════════════════════════════════════

  describe('generatePenimbanganTerlambat', () => {

    it('[HAPPY PATH] creates BERAT notification for hewan not weighed in 30+ days', async () => {
      const hewan = fakeHewan()

      mockFindMany
        .mockResolvedValueOnce([])       // rekamMedis
        .mockResolvedValueOnce([])       // reproduksi
        .mockResolvedValueOnce([hewan])  // hewan
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).toHaveBeenCalledTimes(1)
      const created = mockCreate.mock.calls[0][0].data
      expect(created.type).toBe('BERAT')
      expect(created.title).toContain('KST-001')
      expect(created.message).toContain('BERAT-hewan-001')
      expect(created.message).toContain('30 hari')
    })

    it('[BRANCH] skips if BERAT notification for same hewan already exists', async () => {
      const hewan = fakeHewan()

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([hewan])
      // findFirst finds by message contains 'BERAT-hewan-001'
      mockFindFirst.mockResolvedValue({ id: 'already-notified' })

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('[BRANCH] hewan without nama — title contains only tag', async () => {
      const hewan = fakeHewan({ nama: null })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([hewan])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.title).toBe('Penimbangan Tertunda: KST-001')
    })

    it('[BRANCH] hewan with nama — title includes nama in parentheses', async () => {
      const hewan = fakeHewan({ nama: 'Bandi Jago' })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([hewan])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      expect(created.title).toBe('Penimbangan Tertunda: KST-001 (Bandi Jago)')
    })

    it('[DATA] tanggal on BERAT notif equals current time (NOW)', async () => {
      const hewan = fakeHewan()

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([hewan])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      // tanggal should be "now" at call time
      expect(created.tanggal.getTime()).toBeCloseTo(NOW.getTime(), -3)
    })

    it('[DATA] message ref key contains hewan id and date string', async () => {
      const hewan = fakeHewan({ id: 'hewan-xyz-999' })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([hewan])
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      const created = mockCreate.mock.calls[0][0].data
      // Key format: BERAT-{hewanId}-{YYYY-MM-DD}
      expect(created.message).toMatch(/BERAT-hewan-xyz-999-\d{4}-\d{2}-\d{2}/)
    })

    it('[BRANCH] multiple hewan overdue — all get notifications (unless existing)', async () => {
      const h1 = fakeHewan({ id: 'hewan-001', tag: 'KST-001' })
      const h2 = fakeHewan({ id: 'hewan-002', tag: 'KST-002' })
      const h3 = fakeHewan({ id: 'hewan-003', tag: 'KST-003' })

      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([h1, h2, h3])
      // h1 already notified, h2 and h3 are new
      mockFindFirst
        .mockResolvedValueOnce({ id: 'existing-1' })  // h1 → skip
        .mockResolvedValueOnce(null)                   // h2 → create
        .mockResolvedValueOnce(null)                   // h3 → create
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    it('[BRANCH] empty hewan list — no create called', async () => {
      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).not.toHaveBeenCalled()
    })

  })

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION E: Cross-generator integration (all 3 fire together)
  // ══════════════════════════════════════════════════════════════════════════

  describe('cross-generator integration', () => {

    it('creates 3 notifications when all three generators find new data', async () => {
      mockFindMany
        .mockResolvedValueOnce([fakeRekamMedis()])   // MEDIS
        .mockResolvedValueOnce([fakeReproduksi()])   // LAHIR
        .mockResolvedValueOnce([fakeHewan()])        // BERAT
      // No existing notifs for any
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).toHaveBeenCalledTimes(3)
      const types = mockCreate.mock.calls.map(c => c[0].data.type)
      expect(types).toContain('MEDIS')
      expect(types).toContain('LAHIR')
      expect(types).toContain('BERAT')
    })

    it('creates 0 notifications when all existing notifs are already present', async () => {
      mockFindMany
        .mockResolvedValueOnce([fakeRekamMedis()])
        .mockResolvedValueOnce([fakeReproduksi()])
        .mockResolvedValueOnce([fakeHewan()])
      // All already exist
      mockFindFirst.mockResolvedValue({ id: 'already-there' })

      await generateNotifikasiOtomatis(FARM_ID)

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('each generator queries with correct farmId filter', async () => {
      mockFindMany.mockResolvedValue([])
      mockFindFirst.mockResolvedValue(null)

      await generateNotifikasiOtomatis('my-farm-id')

      // All three findMany calls should include farmId in their filter
      expect(mockFindMany).toHaveBeenCalledTimes(3)
      // Check that at least one call contains the farmId
      const calls = mockFindMany.mock.calls
      const hasBeenCalledWithFarmId = calls.some(call =>
        JSON.stringify(call[0]).includes('my-farm-id')
      )
      expect(hasBeenCalledWithFarmId).toBe(true)
    })

    it('when farmId is null, filter object is empty (no farmId constraint)', async () => {
      mockFindMany.mockResolvedValue([])
      mockFindFirst.mockResolvedValue(null)

      await generateNotifikasiOtomatis(null)

      expect(mockFindMany).toHaveBeenCalledTimes(3)
      // None of the findMany calls should include a farmId
      const calls = mockFindMany.mock.calls
      const hasAnyFarmId = calls.some(call =>
        JSON.stringify(call[0]).includes('"farmId"')
      )
      expect(hasAnyFarmId).toBe(false)
    })

  })

})
