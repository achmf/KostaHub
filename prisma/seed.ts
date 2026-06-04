import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Memulai proses seeding database...')

  // Hapus data lama untuk mencegah duplikasi (Optional, tapi disarankan untuk dummy data fresh)
  await prisma.rekamMedis.deleteMany()
  await prisma.beratBadan.deleteMany()
  await prisma.hewan.deleteMany()
  await prisma.user.deleteMany()
  await prisma.farm.deleteMany()

  const defaultPassword = await bcrypt.hash('password123', 10)

  // 1. Create Super Admin
  await prisma.user.create({
    data: {
      name: 'Super Admin KostaHub',
      email: 'admin@kostahub.com',
      password: defaultPassword,
      role: 'SUPER_ADMIN',
      farmId: null,
    }
  })

  // 2. Create 5 Farms & 5 Owners
  const farmsData = [
    { nama: 'Farm Alpha', alamat: 'Jl. Pegunungan No. 1, Lembang', lat: -6.8175, lng: 107.6191 },
    { nama: 'Farm Beta', alamat: 'Jl. Raya Ciwidey No. 42, Bandung', lat: -7.0833, lng: 107.4500 },
    { nama: 'Farm Gamma', alamat: 'Kp. Ternak Maju, Garut', lat: -7.2278, lng: 107.9086 },
    { nama: 'Farm Delta', alamat: 'Desa Hijau, Sumedang', lat: -6.8381, lng: 107.9253 },
    { nama: 'Farm Epsilon', alamat: 'Lembah Asri, Subang', lat: -6.5614, lng: 107.7597 },
  ]

  for (let i = 0; i < farmsData.length; i++) {
    const farmIdx = i + 1;
    
    // Create Farm
    const farm = await prisma.farm.create({
      data: {
        nama: farmsData[i].nama,
        alamat: farmsData[i].alamat,
        lat: farmsData[i].lat,
        lng: farmsData[i].lng,
        deskripsi: `Peternakan kambing Kosta cabang ${farmIdx}`,
        status: 'AKTIF',
      }
    })

    // Create Owner for this Farm
    await prisma.user.create({
      data: {
        name: `Owner Farm ${farmIdx}`,
        email: `owner${farmIdx}@kostahub.com`,
        password: defaultPassword,
        role: 'OWNER',
        farmId: farm.id,
      }
    })

    // Create varied Hewan for this Farm
    const hewanVariations = [
      { nama: `Bandi ${farmIdx}`, kelamin: 'JANTAN', kategori: 'PEJANTAN', status: 'AKTIF', berat: 65.5, umurBulan: 36, fotoUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746908?auto=format&fit=crop&w=200&q=80' },
      { nama: `Siti ${farmIdx}`, kelamin: 'BETINA', kategori: 'INDUKAN', status: 'AKTIF', berat: 40.2, umurBulan: 24, fotoUrl: 'https://images.unsplash.com/photo-1511692277506-3be3a7ab1686?auto=format&fit=crop&w=200&q=80' },
      { nama: `Cempe Jago ${farmIdx}`, kelamin: 'JANTAN', kategori: 'ANAKAN', status: 'AKTIF', berat: 12.5, umurBulan: 3, fotoUrl: null },
      { nama: `Cempe Manis ${farmIdx}`, kelamin: 'BETINA', kategori: 'ANAKAN', status: 'AKTIF', berat: 11.0, umurBulan: 2, fotoUrl: null },
      { nama: `Dara Ayu ${farmIdx}`, kelamin: 'BETINA', kategori: 'DARA', status: 'TERJUAL', berat: 25.0, umurBulan: 10, fotoUrl: 'https://images.unsplash.com/photo-1584343513076-2e86a9f6d71b?auto=format&fit=crop&w=200&q=80' },
      { nama: `Bujang ${farmIdx}`, kelamin: 'JANTAN', kategori: 'JANTAN_MUDA', status: 'MATI', berat: 30.5, umurBulan: 12, fotoUrl: null },
      { nama: null, kelamin: 'BETINA', kategori: 'INDUKAN', status: 'AKTIF', berat: 38.0, umurBulan: 28, fotoUrl: null }, // Tanpa nama
    ]

    for (let j = 0; j < hewanVariations.length; j++) {
      const variasi = hewanVariations[j];
      const tanggalLahir = new Date();
      tanggalLahir.setMonth(tanggalLahir.getMonth() - variasi.umurBulan);

      const hewan = await prisma.hewan.create({
        data: {
          tag: `KST-${farmIdx}00${j + 1}`,
          nama: variasi.nama,
          kelamin: variasi.kelamin,
          tanggalLahir: tanggalLahir,
          berat: variasi.berat,
          kategori: variasi.kategori,
          status: variasi.status,
          fotoUrl: variasi.fotoUrl,
          farmId: farm.id,
        }
      })

      // Create BeratBadan History
      await prisma.beratBadan.create({
        data: {
          hewanId: hewan.id,
          tanggal: new Date(),
          berat: hewan.berat || 0,
          catatan: 'Pengukuran rutin',
        }
      })

      if (j === 0) {
        await prisma.rekamMedis.create({
          data: {
            hewanId: hewan.id,
            tanggal: new Date(),
            diagnosis: 'Sehat, pemberian vitamin rutin',
            obat: 'Vitamin B Kompleks',
            dokter: 'Drh. Setiawan',
            notes: 'Kondisi sangat prima',
          }
        })
      }
    }

    // Khusus Farm 1, tambahkan silsilah kambing keturunan panjang (4 Generasi)
    if (farmIdx === 1) {
      console.log('   -> Menambahkan data silsilah panjang (4 Generasi) untuk Farm Alpha...')
      
      const g1M = await prisma.hewan.create({ data: { tag: 'KST-1-G1M', nama: 'Mbah Jago', kelamin: 'JANTAN', tanggalLahir: new Date('2019-01-10'), berat: 70, kategori: 'PEJANTAN', farmId: farm.id } })
      const g1F = await prisma.hewan.create({ data: { tag: 'KST-1-G1F', nama: 'Mbah Putri', kelamin: 'BETINA', tanggalLahir: new Date('2019-02-15'), berat: 45, kategori: 'INDUKAN', farmId: farm.id } })

      const g2M = await prisma.hewan.create({ data: { tag: 'KST-1-G2M', nama: 'Kakek Surya', kelamin: 'JANTAN', tanggalLahir: new Date('2020-08-20'), berat: 65, kategori: 'PEJANTAN', farmId: farm.id, bapakId: g1M.id, indukId: g1F.id } })
      const g2F = await prisma.hewan.create({ data: { tag: 'KST-1-G2F', nama: 'Nenek Bulan', kelamin: 'BETINA', tanggalLahir: new Date('2020-09-05'), berat: 42, kategori: 'INDUKAN', farmId: farm.id, bapakId: g1M.id, indukId: g1F.id } })

      // Outcross (Kambing dari luar)
      const g2M_Out = await prisma.hewan.create({ data: { tag: 'KST-1-G2MO', nama: 'Pejantan Pendatang', kelamin: 'JANTAN', tanggalLahir: new Date('2020-01-01'), berat: 68, kategori: 'PEJANTAN', farmId: farm.id } })

      const g3M = await prisma.hewan.create({ data: { tag: 'KST-1-G3M', nama: 'Bapak Bintang', kelamin: 'JANTAN', tanggalLahir: new Date('2022-03-12'), berat: 55, kategori: 'PEJANTAN', farmId: farm.id, bapakId: g2M_Out.id, indukId: g2F.id } })
      const g3F = await prisma.hewan.create({ data: { tag: 'KST-1-G3F', nama: 'Induk Kejora', kelamin: 'BETINA', tanggalLahir: new Date('2022-04-10'), berat: 38, kategori: 'INDUKAN', farmId: farm.id, bapakId: g2M.id, indukId: g2F.id } })

      // Generasi 4 (Anak dari Bapak Bintang & Induk Kejora)
      await prisma.hewan.create({ data: { tag: 'KST-1-G4M1', nama: 'Anak Langit', kelamin: 'JANTAN', tanggalLahir: new Date('2023-11-01'), berat: 30, kategori: 'JANTAN_MUDA', farmId: farm.id, bapakId: g3M.id, indukId: g3F.id } })
      await prisma.hewan.create({ data: { tag: 'KST-1-G4F1', nama: 'Anak Awan', kelamin: 'BETINA', tanggalLahir: new Date('2023-11-01'), berat: 28, kategori: 'DARA', farmId: farm.id, bapakId: g3M.id, indukId: g3F.id } })
      await prisma.hewan.create({ data: { tag: 'KST-1-G4M2', nama: 'Cempe Petir', kelamin: 'JANTAN', tanggalLahir: new Date('2024-05-15'), berat: 15, kategori: 'ANAKAN', farmId: farm.id, bapakId: g3M.id, indukId: g3F.id } })
    }
  }

  console.log('✅ Seed berhasil diselesaikan.')
  console.log('----------------------------------------------------')
  console.log('👤 Akun Super Admin: admin@kostahub.com / password123')
  console.log('👤 Akun Owner 1    : owner1@kostahub.com / password123')
  console.log('   (Tersedia owner1 sampai owner5)')
  console.log('----------------------------------------------------')
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
