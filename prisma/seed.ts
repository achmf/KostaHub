import { PrismaClient, Kelamin, KategoriHewan, KategoriMedis, StatusReproduksi, TipeNotifikasi, PenyebabKematian } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ── UTILITAS GENERASI DATA ──────────────────────────────────────────────
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randomNum = (min: number, max: number, decimals: number = 1): number => {
  const num = Math.random() * (max - min) + min
  return parseFloat(num.toFixed(decimals))
}
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
const subtractMonths = (date: Date, months: number): Date => {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}
const subtractDays = (date: Date, days: number): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}
const addDays = (date: Date, days: number): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// ── REFERENSI NAMA ────────────────────────────────────────────────────────
const namaJantan = ['Bima', 'Arjuna', 'Gatotkaca', 'Nakula', 'Sadewa', 'Petruk', 'Gareng', 'Bagong', 'Semar', 'Bandi', 'Jalu', 'Seta', 'Surya', 'Bintang', 'Guntur', 'Jagad', 'Ganesha', 'Lembu', 'Sakti', 'Wira', 'Rimba', 'Gelap', 'Kliwon', 'Legi', 'Pon', 'Wage']
const namaBetina = ['Srikandi', 'Sita', 'Kunti', 'Drupadi', 'Sinta', 'Arimbi', 'Utari', 'Sumbadra', 'Ayu', 'Laras', 'Melati', 'Mawar', 'Asri', 'Bulan', 'Kejora', 'Purnama', 'Wangi', 'Lestari', 'Tari', 'Sari', 'Indah', 'Cemani', 'Putih', 'Kuning', 'Gendis']
const namaStaffDepan = ['Agus', 'Budi', 'Cipto', 'Dedi', 'Eko', 'Fahmi', 'Gilang', 'Hendra', 'Iwan', 'Joko', 'Ade', 'Rahmat', 'Andi', 'Ahmad', 'Dimas', 'Reza', 'Toni', 'Bayu', 'Arya']
const namaStaffBelakang = ['Santoso', 'Hartono', 'Kurniawan', 'Prasetyo', 'Reza', 'Setiawan', 'Nugroho', 'Saputra', 'Wijaya', 'Permana', 'Mahendra', 'Kusuma', 'Putra', 'Utama']

const kecamatanSerang = [
  'Cipocok Jaya', 'Curug', 'Kasemen', 'Taktakan', 'Walantaka', 'Kramatwatu', 'Waringinkurung', 
  'Bojonegara', 'Pulo Ampel', 'Kragilan', 'Ciruas', 'Pontang', 'Tirtayasa', 'Tanara', 
  'Cikande', 'Kibin', 'Binuang', 'Petir', 'Baros', 'Cikeusal'
]

async function main() {
  console.log('🌱 Memulai proses seeding database (Khusus Kambing Kosta - Serang, Banten)...')
  console.log('🎲 Menerapkan randomisasi penuh (Data Natural)...')

  // 1. Bersihkan Data Lama
  console.log('⏳ Membersihkan database...')
  await prisma.notifikasi.deleteMany()
  await prisma.beratBadan.deleteMany()
  await prisma.transferHewan.deleteMany()
  await prisma.kematianHewan.deleteMany()
  await prisma.reproduksi.deleteMany()
  await prisma.rekamMedis.deleteMany()
  await prisma.hewan.deleteMany()
  await prisma.userFarm.deleteMany()
  await prisma.farm.deleteMany()
  await prisma.user.deleteMany()

  const defaultPassword = await bcrypt.hash('password123', 10)

  // 2. Buat Super Admin
  console.log('👤 Membuat Super Admin...')
  await prisma.user.create({
    data: {
      name: 'Super Admin KostaHub',
      email: 'admin@kostahub.com',
      password: defaultPassword,
      role: 'SUPER_ADMIN',
      phone: '08111222333',
    }
  })

  // 3. Iterasi Pembuatan 20 Farm di Serang, Banten
  for (let i = 0; i < 20; i++) {
    const kecamatan = kecamatanSerang[i]
    const farmIdx = i + 1
    const farmName = `Farm Kosta ${kecamatan}`
    const farmKode = `KST-${farmIdx.toString().padStart(2, '0')}`
    
    // JUMLAH STAFF ACAK (1 - 4)
    const jmlStaff = randomInt(1, 4)
    // JUMLAH KAMBING ACAK
    const jmlPejantan = randomInt(1, 3)
    const jmlIndukan = randomInt(5, 15)
    const jmlMuda = randomInt(5, 20)
    const jmlAnak = randomInt(2, 10)
    const totalKambing = jmlPejantan + jmlIndukan + jmlMuda + jmlAnak

    console.log(`\n🏡 Membuat ${farmName} (${farmIdx}/20) | Petugas: ${jmlStaff} | Kambing: ${totalKambing}`)
    
    const farm = await prisma.farm.create({
      data: {
        nama: farmName,
        alamat: `Jl. Raya Peternakan No. ${randomInt(1, 150)}, Kec. ${kecamatan}, Kab. Serang, Banten`,
        lat: randomNum(-6.110, -6.220, 5),
        lng: randomNum(106.130, 106.210, 5),
        deskripsi: `Peternakan khusus konservasi Kambing Kosta asli Serang, wilayah ${kecamatan}.`,
        status: 'AKTIF',
      }
    })

    // 3a. Buat Owner & Staff Acak
    const owner = await prisma.user.create({
      data: {
        name: `${randomItem(namaStaffDepan)} ${randomItem(namaStaffBelakang)}`,
        email: `owner${farmIdx}@kostahub.com`,
        password: defaultPassword,
        role: 'OWNER',
        phone: `0812${farmIdx.toString().padStart(4, '0')}${randomInt(1000, 9999)}`,
        approvalStatus: 'APPROVED',
      }
    })
    await prisma.userFarm.create({ data: { userId: owner.id, farmId: farm.id } })

    const staffIds: string[] = []
    const suffix = ['a', 'b', 'c', 'd']
    for(let s=0; s<jmlStaff; s++) {
      const staff = await prisma.user.create({
        data: {
          name: `${randomItem(namaStaffDepan)} ${randomItem(namaStaffBelakang)}`,
          email: `petugas${farmIdx}${suffix[s]}@kostahub.com`,
          password: defaultPassword,
          role: 'PETUGAS',
          approvalStatus: 'APPROVED',
        }
      })
      await prisma.userFarm.create({ data: { userId: staff.id, farmId: farm.id } })
      staffIds.push(staff.id)
    }

    // Fungsi utilitas untuk mengambil staff secara acak dari yang tersedia di farm ini
    const getRandomStaffId = () => randomItem(staffIds)

    // 3b. Buat Populasi Kambing Kosta dengan data acak
    
    // --- PEJANTAN ---
    const pejantanIds: string[] = []
    for(let j=1; j<=jmlPejantan; j++) {
      const h = await prisma.hewan.create({
        data: {
          tag: `${farmKode}-PJ-${j.toString().padStart(3, '0')}`,
          nama: `${randomItem(namaJantan)}`,
          kelamin: 'JANTAN',
          kategori: 'PEJANTAN',
          berat: randomNum(35, 48), // Berat Kosta asli dewasa
          tanggalLahir: subtractDays(new Date(), randomInt(1000, 1800)), // 3-5 tahun
          farmId: farm.id
        }
      })
      pejantanIds.push(h.id)
      await generateRiwayat(h, randomInt(6, 12), getRandomStaffId())
    }

    // --- INDUKAN ---
    const indukanIds: string[] = []
    for(let j=1; j<=jmlIndukan; j++) {
      const h = await prisma.hewan.create({
        data: {
          tag: `${farmKode}-ID-${j.toString().padStart(3, '0')}`,
          nama: `${randomItem(namaBetina)}`,
          kelamin: 'BETINA',
          kategori: 'INDUKAN',
          berat: randomNum(25, 38),
          tanggalLahir: subtractDays(new Date(), randomInt(700, 1500)), // 2-4 tahun
          farmId: farm.id
        }
      })
      indukanIds.push(h.id)
      await generateRiwayat(h, randomInt(6, 12), getRandomStaffId())
    }

    // --- DARA & JANTAN MUDA (Keturunan) ---
    for(let j=1; j<=jmlMuda; j++) {
      const isJantan = Math.random() > 0.5
      const kategori = isJantan ? 'JANTAN_MUDA' : 'DARA'
      const prefix = isJantan ? 'JM' : 'DR'
      
      const h = await prisma.hewan.create({
        data: {
          tag: `${farmKode}-${prefix}-${j.toString().padStart(3, '0')}`,
          nama: `${isJantan ? randomItem(namaJantan) : randomItem(namaBetina)}`,
          kelamin: isJantan ? 'JANTAN' : 'BETINA',
          kategori: kategori,
          berat: randomNum(15, 25),
          tanggalLahir: subtractDays(new Date(), randomInt(200, 450)), // 6-15 bulan
          bapakId: pejantanIds.length > 0 && Math.random() > 0.2 ? randomItem(pejantanIds) : undefined, // 80% punya bapak tercatat
          indukId: indukanIds.length > 0 && Math.random() > 0.1 ? randomItem(indukanIds) : undefined,   // 90% punya induk tercatat
          farmId: farm.id
        }
      })
      await generateRiwayat(h, randomInt(3, 7), getRandomStaffId())
    }

    // --- ANAKAN / CEMPE ---
    for(let j=1; j<=jmlAnak; j++) {
      const isJantan = Math.random() > 0.5
      
      const h = await prisma.hewan.create({
        data: {
          tag: `${farmKode}-AN-${j.toString().padStart(3, '0')}`,
          nama: `Cempe ${isJantan ? randomItem(namaJantan) : randomItem(namaBetina)}`,
          kelamin: isJantan ? 'JANTAN' : 'BETINA',
          kategori: 'ANAKAN',
          berat: randomNum(3, 10),
          tanggalLahir: subtractDays(new Date(), randomInt(10, 120)), // 10 hari - 4 bulan
          bapakId: pejantanIds.length > 0 ? randomItem(pejantanIds) : undefined,
          indukId: indukanIds.length > 0 ? randomItem(indukanIds) : undefined,
          farmId: farm.id
        }
      })
      // 15% kemungkinan anakan mati (demo data untuk mortality rate)
      if (Math.random() < 0.15) {
        const penyebabOptions: PenyebabKematian[] = ['PENYAKIT', 'LAINNYA', 'MELAHIRKAN']
        await prisma.kematianHewan.create({
          data: {
            hewanId: h.id,
            tanggalMati: subtractDays(new Date(), randomInt(1, 90)),
            penyebab: randomItem(penyebabOptions),
            catatan: randomItem(['Sakit mendadak', 'Tidak ada keterangan', 'Lemah sejak lahir', null]),
          }
        })
      }
      await generateRiwayat(h, randomInt(1, 3), getRandomStaffId())
    }

    // 3c. Reproduksi (Kehamilan ACAK per farm)
    // Tidak semua farm punya indukan hamil, random antara 0 sampai 4 indukan
    const jmlHamil = randomInt(0, Math.min(4, jmlIndukan))
    // Pilih indukan secara acak tanpa duplikat
    const hamilIndukanIds = [...indukanIds].sort(() => 0.5 - Math.random()).slice(0, jmlHamil)
    
    for(let k=0; k<jmlHamil; k++) {
      // Tanggal kawin acak antara 10 hari lalu sampai 140 hari lalu
      const tglKawin = subtractDays(new Date(), randomInt(10, 140))
      const estimasi = addDays(tglKawin, 150)
      
      await prisma.reproduksi.create({
        data: {
          indukId: hamilIndukanIds[k],
          pejantanId: pejantanIds.length > 0 ? randomItem(pejantanIds) : pejantanIds[0], // fallback jika tdk ada
          tanggalKawin: tglKawin,
          estimasiLahir: estimasi,
          status: 'HAMIL',
        }
      })

      // Jika estimasi lahir kurang dari 30 hari, buat notifikasi
      const hariKeLahir = Math.floor((estimasi.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (hariKeLahir > 0 && hariKeLahir <= 30) {
        await prisma.notifikasi.create({
          data: {
            farmId: farm.id,
            title: 'Persiapan Kelahiran Kambing Kosta',
            message: `Indukan Kosta ID ${hamilIndukanIds[k].slice(0,8)} diperkirakan melahirkan sekitar ${hariKeLahir} hari lagi (${estimasi.toLocaleDateString('id-ID')}).`,
            type: 'LAHIR',
            tanggal: subtractDays(new Date(), randomInt(0, 2)), // Notifikasi muncul 0-2 hari lalu
          }
        })
      }
    }
    
    // Notifikasi umum secara acak
    if (Math.random() > 0.5) {
      await prisma.notifikasi.create({
        data: {
          farmId: farm.id,
          title: 'Jadwal Vaksinasi PMK Daerah Serang',
          message: 'Pemberitahuan dari dinas: Vaksinasi PMK akan dilakukan dalam waktu dekat.',
          type: 'VAKSIN',
          tanggal: subtractDays(new Date(), randomInt(1, 5)),
        }
      })
    }
  }

  console.log('\n✅ SEEDING SELESAI DENGAN DATA NATURAL & ACAK!')
}

// Helper: Membangun riwayat kesehatan dan berat badan yang natural
async function generateRiwayat(hewan: any, bulanMundur: number, dokterId: string) {
  let beratSekarang = hewan.berat || 20

  // 1. Generate Berat Badan mundur ke belakang dengan fluktuasi acak
  for(let i=0; i<bulanMundur; i++) {
    // Tanggal pengukuran tidak selalu tepat tanggal yang sama setiap bulan, diacak +/- 5 hari
    const tglDasar = subtractMonths(new Date(), i)
    const tgl = addDays(tglDasar, randomInt(-5, 5))
    
    // Mundur ke belakang berarti berat badannya lebih kecil
    // Kadang naiknya banyak, kadang sedikit
    const beratLalu = beratSekarang - randomNum(0.1, 1.5)
    
    if (beratLalu < 2) break;

    await prisma.beratBadan.create({
      data: {
        hewanId: hewan.id,
        tanggal: tgl,
        berat: parseFloat(beratLalu.toFixed(1)),
        catatan: randomItem(['Penimbangan rutin', 'Kondisi sehat', 'Pengecekan', '']),
      }
    })
    beratSekarang = beratLalu
  }

  // 2. Generate Rekam Medis (Acak)
  const isVaksin = Math.random() > 0.3 // 70% sudah vaksin
  if (isVaksin && bulanMundur >= 4) {
    await prisma.rekamMedis.create({
      data: {
        hewanId: hewan.id,
        tanggal: subtractDays(new Date(), randomInt(120, 200)),
        kategori: 'VAKSINASI',
        diagnosis: 'Vaksinasi PMK Banten',
        obat: 'Aftopor',
        dokterId: dokterId,
        notes: '2ml intramuskular',
      }
    })
  }

  const isVitamin = Math.random() > 0.4 // 60% dapet vitamin
  if (isVitamin && bulanMundur >= 1) {
    await prisma.rekamMedis.create({
      data: {
        hewanId: hewan.id,
        tanggal: subtractDays(new Date(), randomInt(15, 60)),
        kategori: 'VITAMIN',
        diagnosis: 'Injeksi Vitamin',
        obat: 'B-Kompleks',
        dokterId: dokterId,
        notes: 'Hewan sehat',
      }
    })
  }

  // 3. Penyakit ringan (Acak 20%)
  if (Math.random() < 0.2) {
    await prisma.rekamMedis.create({
      data: {
        hewanId: hewan.id,
        tanggal: subtractDays(new Date(), randomInt(5, 45)),
        kategori: 'PENGOBATAN_PARASIT',
        diagnosis: randomItem(['Scabies / Gudik ringan', 'Cacingan', 'Luka gores ringan', 'Kutu']),
        obat: randomItem(['Ivermectin', 'Albendazole', 'Salep Antibiotik']),
        dokterId: dokterId,
        notes: 'Sudah ditangani dengan baik.',
      }
    })
  }
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
