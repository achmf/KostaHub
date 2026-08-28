/**
 * Blackbox Test: Notifikasi Vaksin & Lahir
 *
 * Strategy:
 * 1. Insert RekamMedis with tanggalLanjut = 2 days from now (within 3-day window)
 * 2. Insert Reproduksi with estimasiLahir = 3 days from now (within 7-day window)
 * 3. Hit GET /api/notifikasi (triggers generator)
 * 4. Verify notifications exist in DB
 * 5. Cleanup test data
 *
 * Run: npx tsx scripts/test-notif-vaksin-lahir.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'

function log(msg: string) { console.log(msg) }
function ok(msg: string) { log(`${GREEN}✅ PASS${RESET} ${msg}`) }
function fail(msg: string) { log(`${RED}❌ FAIL${RESET} ${msg}`) }
function info(msg: string) { log(`${CYAN}ℹ  ${RESET}${msg}`) }
function warn(msg: string) { log(`${YELLOW}⚠  ${RESET}${msg}`) }

async function main() {
  log('\n' + '═'.repeat(60))
  log(`${CYAN} BLACKBOX TEST: Notifikasi Vaksin & Lahir${RESET}`)
  log('═'.repeat(60) + '\n')

  // ── 1. Find an active farm + hewan to anchor test data ──────────────
  const farm = await prisma.farm.findFirst({ where: { status: 'AKTIF' } })
  if (!farm) {
    fail('No active farm found. Seed a farm first.')
    process.exit(1)
  }
  info(`Using farm: ${farm.nama} (${farm.id})`)

  const hewanBetina = await prisma.hewan.findFirst({
    where: { farmId: farm.id, status: 'AKTIF', kelamin: 'BETINA' },
  })
  const hewanJantan = await prisma.hewan.findFirst({
    where: { farmId: farm.id, status: 'AKTIF', kelamin: 'JANTAN' },
  })

  if (!hewanBetina || !hewanJantan) {
    fail('Need at least 1 betina + 1 jantan hewan in the farm.')
    process.exit(1)
  }
  info(`Using betina: ${hewanBetina.tag}, jantan: ${hewanJantan.tag}`)

  // ── 2. Cleanup stale test notifs from previous runs ──────────────────
  const deleted = await prisma.notifikasi.deleteMany({
    where: { message: { contains: 'TEST-BLACKBOX' } },
  })
  if (deleted.count > 0) warn(`Cleaned ${deleted.count} leftover test notifs`)

  // ── 3. Insert test RekamMedis (tanggalLanjut = 2 days from now) ──────
  const dua_hari = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  const rekamTest = await prisma.rekamMedis.create({
    data: {
      hewanId: hewanBetina.id,
      tanggal: new Date(),
      kategori: 'VAKSINASI',
      diagnosis: '[TEST-BLACKBOX] Vaksin PMK Test',
      tanggalLanjut: dua_hari,
      status: 'RAWAT',
    },
  })
  info(`Inserted RekamMedis test record: ${rekamTest.id} (tanggalLanjut: ${dua_hari.toLocaleDateString('id-ID')})`)

  // ── 4. Insert test Reproduksi (estimasiLahir = 3 days from now) ──────
  const tiga_hari = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const reproduksiTest = await prisma.reproduksi.create({
    data: {
      indukId: hewanBetina.id,
      pejantanId: hewanJantan.id,
      tanggalKawin: new Date(Date.now() - 145 * 24 * 60 * 60 * 1000),
      estimasiLahir: tiga_hari,
      status: 'HAMIL',
    },
  })
  info(`Inserted Reproduksi test record: ${reproduksiTest.id} (estimasiLahir: ${tiga_hari.toLocaleDateString('id-ID')})`)

  // ── 5. Directly invoke the generator (simulate GET /api/notifikasi) ──
  log('\n── Running generator...')
  const { generateNotifikasiOtomatis } = await import('../lib/notifikasi-generator')
  await generateNotifikasiOtomatis(farm.id)
  log('   Generator complete.\n')

  // ── 6. Verify VAKSIN notification was created ─────────────────────────
  log('── TEST 1: VAKSIN notification')
  const vaksinKey = `VAKSIN-${rekamTest.id}`
  const vaksinNotif = await prisma.notifikasi.findFirst({
    where: { message: { contains: vaksinKey } },
  })
  if (vaksinNotif) {
    ok(`VAKSIN notif created: "${vaksinNotif.title}"`)
    info(`   Type: ${vaksinNotif.type}, tanggal: ${vaksinNotif.tanggal.toLocaleDateString('id-ID')}`)
    if (vaksinNotif.type !== 'VAKSIN') fail('type bukan VAKSIN!')
    else ok('type = VAKSIN ✓')
    if (vaksinNotif.farmId !== farm.id) fail(`farmId mismatch: ${vaksinNotif.farmId}`)
    else ok(`farmId = ${farm.id} ✓`)
    if (vaksinNotif.isRead !== false) fail('isRead should be false')
    else ok('isRead = false ✓')
  } else {
    fail(`VAKSIN notif NOT found (key: ${vaksinKey})`)
  }

  // ── 7. Verify LAHIR notification was created ──────────────────────────
  log('\n── TEST 2: LAHIR notification')
  const lahirKey = `LAHIR-${reproduksiTest.id}`
  const lahirNotif = await prisma.notifikasi.findFirst({
    where: { message: { contains: lahirKey } },
  })
  if (lahirNotif) {
    ok(`LAHIR notif created: "${lahirNotif.title}"`)
    info(`   Type: ${lahirNotif.type}, tanggal: ${lahirNotif.tanggal.toLocaleDateString('id-ID')}`)
    if (lahirNotif.type !== 'LAHIR') fail('type bukan LAHIR!')
    else ok('type = LAHIR ✓')
    if (lahirNotif.farmId !== farm.id) fail(`farmId mismatch: ${lahirNotif.farmId}`)
    else ok(`farmId = ${farm.id} ✓`)
    if (lahirNotif.isRead !== false) fail('isRead should be false')
    else ok('isRead = false ✓')
  } else {
    fail(`LAHIR notif NOT found (key: ${lahirKey})`)
  }

  // ── 8. Verify idempotency (run generator again — should NOT duplicate) ─
  log('\n── TEST 3: Idempotency (re-run generator)')
  await generateNotifikasiOtomatis(farm.id)
  const vaksinCount = await prisma.notifikasi.count({
    where: { message: { contains: vaksinKey } },
  })
  const lahirCount = await prisma.notifikasi.count({
    where: { message: { contains: lahirKey } },
  })
  if (vaksinCount === 1) ok(`VAKSIN not duplicated (count=1) ✓`)
  else fail(`VAKSIN duplicated! count=${vaksinCount}`)
  if (lahirCount === 1) ok(`LAHIR not duplicated (count=1) ✓`)
  else fail(`LAHIR duplicated! count=${lahirCount}`)

  // ── 9. Verify the notifs appear in list query (as API would return) ───
  log('\n── TEST 4: API list query simulation')
  const allNotifs = await prisma.notifikasi.findMany({
    where: { farmId: farm.id },
    orderBy: [{ isRead: 'asc' }, { tanggal: 'desc' }],
    take: 100,
  })
  const vaksinInList = allNotifs.find(n => n.message.includes(vaksinKey))
  const lahirInList  = allNotifs.find(n => n.message.includes(lahirKey))
  if (vaksinInList) ok('VAKSIN appears in list query ✓')
  else fail('VAKSIN missing from list query')
  if (lahirInList) ok('LAHIR appears in list query ✓')
  else fail('LAHIR missing from list query')

  // ── 10. Cleanup ────────────────────────────────────────────────────────
  log('\n── Cleanup...')
  await prisma.notifikasi.deleteMany({ where: { message: { contains: vaksinKey } } })
  await prisma.notifikasi.deleteMany({ where: { message: { contains: lahirKey } } })
  await prisma.reproduksi.delete({ where: { id: reproduksiTest.id } })
  await prisma.rekamMedis.delete({ where: { id: rekamTest.id } })
  ok('Test data cleaned up')

  log('\n' + '═'.repeat(60))
  log(`${GREEN} ALL TESTS COMPLETE${RESET}`)
  log('═'.repeat(60) + '\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
