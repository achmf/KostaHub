/**
 * Seed data silsilah kambing untuk testing fitur keturunan & inbreeding detection.
 *
 * STRUKTUR POHON SILSILAH:
 *
 * GENERASI 1 (KAKEK/NENEK - leluhur tertua):
 *   [G1-BAPAK-001] ♂ Arjuna   +   [G1-INDUK-001] ♀ Srikandi
 *   [G1-BAPAK-002] ♂ Gatot    +   [G1-INDUK-002] ♀ Larasati
 *
 * GENERASI 2 (ORANG TUA):
 *   [G2-001] ♂ Bagas  = anak dari Arjuna + Srikandi
 *   [G2-002] ♀ Ratih  = anak dari Gatot + Larasati
 *   [G2-003] ♂ Danu   = anak dari Arjuna + Srikandi  ← SAUDARA dari Bagas!
 *   [G2-004] ♀ Melati = anak dari Gatot + Larasati
 *
 * GENERASI 3 (ANAK - generasi terkini):
 *   [G3-001] ♀ Cempaka = anak dari Bagas + Ratih     ← NORMAL (beda leluhur)
 *   [G3-002] ♂ Rendra  = anak dari Bagas + Ratih     ← NORMAL
 *
 * PASANGAN INBREEDING UNTUK TEST:
 *   Coba kawinkan: [G3-001] Cempaka ♀ (Indukan) + [G2-003] Danu ♂ (Pejantan)
 *   → Danu adalah PAMAN dari Cempaka (keduanya punya Arjuna sebagai kakek/bapak)
 *   → Sistem HARUS mendeteksi leluhur bersama: Arjuna & Srikandi
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const FARM_ID = '72bca293-7995-4267-8c46-558cbce183a4' // Farm Alpha

async function main() {
  console.log('🌱 Seeding data silsilah kambing...\n')

  // --- GENERASI 1: LELUHUR ---
  const arjuna = await p.hewan.create({
    data: {
      tag: 'SL-G1-001',
      nama: 'Arjuna',
      kelamin: 'JANTAN',
      kategori: 'PEJANTAN',

      tanggalLahir: new Date('2018-03-10'),
      berat: 65,
      status: 'AKTIF',
      farmId: FARM_ID,
    }
  })
  console.log(`✅ [G1] ♂ Arjuna — ${arjuna.id}`)

  const srikandi = await p.hewan.create({
    data: {
      tag: 'SL-G1-002',
      nama: 'Srikandi',
      kelamin: 'BETINA',
      kategori: 'INDUKAN',

      tanggalLahir: new Date('2018-07-22'),
      berat: 52,
      status: 'AKTIF',
      farmId: FARM_ID,
    }
  })
  console.log(`✅ [G1] ♀ Srikandi — ${srikandi.id}`)

  const gatot = await p.hewan.create({
    data: {
      tag: 'SL-G1-003',
      nama: 'Gatot',
      kelamin: 'JANTAN',
      kategori: 'PEJANTAN',

      tanggalLahir: new Date('2017-11-05'),
      berat: 70,
      status: 'AKTIF',
      farmId: FARM_ID,
    }
  })
  console.log(`✅ [G1] ♂ Gatot — ${gatot.id}`)

  const larasati = await p.hewan.create({
    data: {
      tag: 'SL-G1-004',
      nama: 'Larasati',
      kelamin: 'BETINA',
      kategori: 'INDUKAN',

      tanggalLahir: new Date('2018-01-15'),
      berat: 48,
      status: 'AKTIF',
      farmId: FARM_ID,
    }
  })
  console.log(`✅ [G1] ♀ Larasati — ${larasati.id}`)

  // --- GENERASI 2: ORANG TUA ---
  const bagas = await p.hewan.create({
    data: {
      tag: 'SL-G2-001',
      nama: 'Bagas',
      kelamin: 'JANTAN',
      kategori: 'PEJANTAN',

      tanggalLahir: new Date('2020-05-14'),
      berat: 58,
      status: 'AKTIF',
      farmId: FARM_ID,
      bapakId: arjuna.id,    // Anak dari Arjuna
      indukId: srikandi.id,  // Anak dari Srikandi
    }
  })
  console.log(`✅ [G2] ♂ Bagas (anak Arjuna+Srikandi) — ${bagas.id}`)

  const ratih = await p.hewan.create({
    data: {
      tag: 'SL-G2-002',
      nama: 'Ratih',
      kelamin: 'BETINA',
      kategori: 'INDUKAN',

      tanggalLahir: new Date('2020-08-30'),
      berat: 45,
      status: 'AKTIF',
      farmId: FARM_ID,
      bapakId: gatot.id,     // Anak dari Gatot
      indukId: larasati.id,  // Anak dari Larasati
    }
  })
  console.log(`✅ [G2] ♀ Ratih (anak Gatot+Larasati) — ${ratih.id}`)

  // Danu = SAUDARA Bagas (sama-sama anak Arjuna+Srikandi)
  const danu = await p.hewan.create({
    data: {
      tag: 'SL-G2-003',
      nama: 'Danu',
      kelamin: 'JANTAN',
      kategori: 'PEJANTAN',

      tanggalLahir: new Date('2021-02-20'),
      berat: 55,
      status: 'AKTIF',
      farmId: FARM_ID,
      bapakId: arjuna.id,    // SAUDARA Bagas — bapak sama
      indukId: srikandi.id,  // SAUDARA Bagas — induk sama
    }
  })
  console.log(`✅ [G2] ♂ Danu (anak Arjuna+Srikandi, SAUDARA Bagas) — ${danu.id}`)

  const melati = await p.hewan.create({
    data: {
      tag: 'SL-G2-004',
      nama: 'Melati',
      kelamin: 'BETINA',
      kategori: 'INDUKAN',

      tanggalLahir: new Date('2021-06-10'),
      berat: 42,
      status: 'AKTIF',
      farmId: FARM_ID,
      bapakId: gatot.id,
      indukId: larasati.id,
    }
  })
  console.log(`✅ [G2] ♀ Melati (anak Gatot+Larasati, SAUDARA Ratih) — ${melati.id}`)

  // --- GENERASI 3: ANAK ---
  const cempaka = await p.hewan.create({
    data: {
      tag: 'SL-G3-001',
      nama: 'Cempaka',
      kelamin: 'BETINA',
      kategori: 'DARA',

      tanggalLahir: new Date('2023-01-08'),
      berat: 38,
      status: 'AKTIF',
      farmId: FARM_ID,
      bapakId: bagas.id,   // Anak dari Bagas
      indukId: ratih.id,   // Anak dari Ratih
    }
  })
  console.log(`✅ [G3] ♀ Cempaka (anak Bagas+Ratih) — ${cempaka.id}`)

  const rendra = await p.hewan.create({
    data: {
      tag: 'SL-G3-002',
      nama: 'Rendra',
      kelamin: 'JANTAN',
      kategori: 'JANTAN_MUDA',

      tanggalLahir: new Date('2023-04-15'),
      berat: 40,
      status: 'AKTIF',
      farmId: FARM_ID,
      bapakId: bagas.id,
      indukId: ratih.id,
    }
  })
  console.log(`✅ [G3] ♂ Rendra (anak Bagas+Ratih, SAUDARA Cempaka) — ${rendra.id}`)

  console.log('\n')
  console.log('=' .repeat(60))
  console.log('🎯 SILSILAH BERHASIL DIBUAT')
  console.log('=' .repeat(60))
  console.log('\n📌 SKENARIO TEST:')
  console.log()
  console.log('1️⃣  NORMAL (Tidak ada warning):')
  console.log(`   Induk: Ratih [SL-G2-002] ♀`)
  console.log(`   Pejantan: Danu [SL-G2-003] ♂`)
  console.log(`   → Leluhur berbeda, TIDAK ada peringatan`)
  console.log()
  console.log('2️⃣  INBREEDING - Paman kawin dengan keponakan:')
  console.log(`   Induk: Cempaka [SL-G3-001] ♀ (cucunya Arjuna+Srikandi via Bagas)`)
  console.log(`   Pejantan: Danu [SL-G2-003] ♂ (anaknya Arjuna+Srikandi)`)
  console.log(`   → HARUS MUNCUL WARNING! Leluhur bersama: Arjuna + Srikandi`)
  console.log()
  console.log('3️⃣  INBREEDING PARAH - Saudara kandung:')
  console.log(`   Induk: Cempaka [SL-G3-001] ♀`)
  console.log(`   Pejantan: Rendra [SL-G3-002] ♂`)
  console.log(`   → HARUS MUNCUL WARNING! Mereka saudara kandung (Bagas+Ratih)`)
  console.log()
  console.log('4️⃣  TEST POHON SILSILAH:')
  console.log(`   Buka halaman detail Cempaka [SL-G3-001]`)
  console.log(`   → Pohon silsilah harus tampil 3 generasi: Cempaka → Bagas+Ratih → Arjuna+Srikandi+Gatot+Larasati`)
  console.log()
  console.log(`📍 Farm: Farm Alpha`)
  console.log(`🔗 URL: http://localhost:3000/hewan`)
  console.log()
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect())
