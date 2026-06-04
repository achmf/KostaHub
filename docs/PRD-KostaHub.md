# PRD — KostaHub: Sistem Manajemen Peternakan Kambing

**Versi:** 2.0  
**Tanggal:** Mei 2026  
**Status:** Production (Active Development)  
**Platform:** Web App (Next.js 15, App Router, PostgreSQL)

---

## 1. Ringkasan Produk

**KostaHub** adalah sistem informasi manajemen peternakan kambing berbasis web yang digunakan oleh pemilik dan pengelola farm untuk memantau populasi hewan, kesehatan ternak, reproduksi, dan mutasi antar lokasi. Sistem ini mendukung operasional multi-farm di bawah satu organisasi (peternakan "Kosta") dengan hierarki akses berbasis role.

### Tagline
> *Pantau populasi, kesehatan, dan reproduksi ternak kambing Anda — dari satu dashboard.*

### Target Pengguna
| Peran | Deskripsi |
|-------|-----------|
| **Super Admin** | Operator pusat yang memantau dan mengelola seluruh farm secara agregat |
| **Owner** | Pemilik farm individual — hanya melihat dan mengelola farm miliknya |

---

## 2. Konteks & Problem Statement

Peternakan kambing skala menengah-besar umumnya mencatat data hewan, rekam medis, dan reproduksi secara manual (buku, Excel). Ini menyebabkan:
- Data tidak terpusat → sulit audit lintas cabang
- Tidak ada pengingat otomatis untuk vaksin atau estimasi kelahiran
- Rekam medis terpisah dari data populasi
- Tidak ada visibilitas real-time untuk manajemen multi-farm

KostaHub hadir sebagai solusi digital yang menyatukan semua operasional peternakan dalam satu platform berbasis web.

---

## 3. Arsitektur Sistem

### Stack Teknologi
| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Backend | Next.js Server Actions, API Routes |
| Database | PostgreSQL via Prisma ORM |
| Auth | Session-based (cookie, `iron-session`) |
| Charting | Recharts |
| Maps | Leaflet (GIS integration) |

### Database Entities (Prisma Schema)

```
User          — Akun pengguna (Super Admin / Owner)
Farm          — Lokasi peternakan (nama, alamat, koordinat GPS, GeoJSON)
Hewan         — Data individu kambing (tag, nama, kelamin, ras, berat, kategori, status)
RekamMedis    — Riwayat kesehatan per hewan (diagnosis, obat, dokter)
Reproduksi    — Catatan perkawinan (induk × pejantan, estimasi lahir, status)
BeratBadan    — Riwayat penimbangan per hewan
TransferHewan — Mutasi/transfer hewan antar farm
Notifikasi    — Pengingat jadwal vaksin, kelahiran, dll
```

---

## 4. Sistem Autentikasi & Role

### Role Matrix
| Fitur | Super Admin | Owner |
|-------|:-----------:|:-----:|
| Dashboard agregat semua farm | ✅ | ❌ |
| Pilih farm via dropdown | ✅ | ❌ |
| Manajemen Farm (CRUD) | ✅ | ❌ |
| Peta GIS semua farm | ✅ | ✅ |
| Data Populasi Hewan | ✅ (semua) | ✅ (farm sendiri) |
| Rekam Medis | ✅ (semua) | ✅ (farm sendiri) |
| Reproduksi | ✅ (semua) | ✅ (farm sendiri) |
| Berat Badan | ✅ (semua) | ✅ (farm sendiri) |
| Laporan & Analitik | ✅ | ✅ |
| Notifikasi | ✅ | ✅ |

### Akun Demo
| Email | Password | Role |
|-------|----------|------|
| `admin@kostahub.com` | `password123` | Super Admin |
| `owner1@kostahub.com` | `password123` | Owner Farm Alpha |
| `owner2@kostahub.com` | `password123` | Owner Farm Beta |
| `owner3@kostahub.com` | `password123` | Owner Farm Gamma |
| `owner4@kostahub.com` | `password123` | Owner Farm Delta |
| `owner5@kostahub.com` | `password123` | Owner Farm Epsilon |

---

## 5. Struktur Navigasi (Route Map)

```
/login                    → Halaman login
/                         → Dashboard (ringkasan operasional)
/hewan                    → Daftar populasi hewan
/hewan/tambah             → Form tambah hewan baru
/hewan/[id]               → Detail hewan (modal/page)
/hewan/[id]/edit          → Edit data hewan
/medis                    → Daftar rekam medis
/medis/tambah             → Form tambah rekam medis
/reproduksi               → Daftar catatan reproduksi
/reproduksi/tambah        → Form catat perkawinan baru
/berat                    → Monitoring berat badan per hewan
/laporan                  → Laporan & analitik (multi-tab)
/notifikasi               → Daftar notifikasi & reminder
/notifikasi/tambah        → Buat reminder baru
/farm                     → Manajemen farm (Super Admin only)
/map                      → Peta GIS lokasi farm
```

---

## 6. Modul & Fitur Detail

### 6.1 Dashboard (`/`)

**Tujuan:** Overview cepat kondisi operasional farm.

**Komponen:**
- **4 Primary Stat Cards:** Total Populasi, Indukan Aktif, Pejantan, Dalam Perawatan
- **2 Secondary Stat Cards:** Angka Kematian, Total Terjual
- **Donut/Pie Chart:** Distribusi kategori hewan (Indukan, Pejantan, Anakan, Dara, Jantan Muda)
- **Daftar Estimasi Kelahiran:** 5 terdekat berdasarkan tanggal
- **Daftar Notifikasi Vaksin:** 5 aktif terdekat

**Behavior Super Admin:**
- Menampilkan data agregat seluruh farm
- Info banner jumlah farm terdaftar
- Bisa filter per farm via dropdown di header

### 6.2 Populasi Hewan (`/hewan`)

**Tujuan:** Manajemen data individu kambing.

**Data per Hewan:**
- `tag` — ID unik (format: `KST-XXXXX`), wajib
- `nama` — Nama opsional (bisa kosong → ditampilkan "Tanpa Nama")
- `kelamin` — JANTAN / BETINA
- `ras` — Kosta, PE, Boer, Saanen, dll
- `tanggalLahir` — Untuk kalkulasi umur
- `berat` — Berat terkini (kg)
- `kategori` — INDUKAN / PEJANTAN / ANAKAN / DARA / JANTAN_MUDA
- `status` — AKTIF / MATI / TERJUAL
- `fotoUrl` — Foto opsional

**Fitur Tabel:**
- Kolom: Avatar/inisial, Nama+Tag, Kategori (badge), Kelamin, Tgl Lahir, Berat, Farm (SA only), Status, Aksi
- Klik baris / tombol "Detail" → Modal detail profil kambing
- Tombol "Tambah Hewan" → `/hewan/tambah`

**Modal Detail Profil Kambing:**
- Header dengan banner hijau + avatar besar (foto atau inisial)
- Badge Kategori + Badge Status
- Grid 4 info card: Tanggal Lahir (+ umur bulan), Berat Terkini, Lokasi Farm, Jumlah Rekam Medis
- Riwayat penimbangan 3 terakhir (jika ada)
- Footer: Tombol Tutup + Edit Data

### 6.3 Rekam Medis (`/medis`)

**Tujuan:** Riwayat kesehatan dan tindakan medis.

**Data per Record:**
- `tanggal` — Tanggal tindakan
- `hewan` — Link ke hewan (nama + tag)
- `diagnosis` — Diagnosis / tindakan yang dilakukan
- `obat` — Obat yang diberikan (opsional)
- `dokter` — Nama dokter/petugas (opsional)
- `notes` — Catatan tambahan (opsional)
- `fotoUrl` — Foto kondisi hewan (opsional)

**Fitur:** Tabel daftar, tambah rekam medis baru.

### 6.4 Reproduksi (`/reproduksi`)

**Tujuan:** Pencatatan perkawinan dan monitoring kehamilan.

**Data per Record:**
- `induk` — Hewan betina (INDUKAN)
- `pejantan` — Hewan jantan
- `tanggalKawin` — Tanggal perkawinan
- `estimasiLahir` — Otomatis +150 hari dari tanggal kawin
- `status` — HAMIL / LAHIR / GAGAL
- `anakTag` — Tag anak (diisi saat status = LAHIR)

**Fitur:** Tabel dengan badge status berwarna (kuning/hijau/merah), tambah catatan perkawinan baru.

### 6.5 Berat Badan (`/berat`)

**Tujuan:** Monitoring pertumbuhan berat badan per individu hewan.

**Fitur:**
- Daftar hewan aktif beserta berat terkini
- Tombol catat penimbangan baru per hewan
- Histori penimbangan

### 6.6 Laporan & Analitik (`/laporan`)

**Tujuan:** Laporan komprehensif untuk manajemen dan audit.

**Layout:**
- **Row 1:** Executive Summary card (total populasi global, kasus medis, total transfer) + Bar Chart distribusi populasi per farm
- **Row 2:** Pie Chart rasio kategori global + Bar Chart frekuensi medis per farm (horizontal)
- **Section 3:** Multi-tab tabel data detail:
  - **Tab Populasi** — Semua hewan (tag, kategori, farm, berat, terdaftar)
  - **Tab Reproduksi** — Semua catatan kawin (induk, pejantan, farm, status)
  - **Tab Rekam Medis** — Semua rekam medis (tag, tanggal, diagnosis, obat, dokter)
  - **Tab Mutasi & Transfer** — Riwayat perpindahan hewan antar farm

**Aksi:** Export Excel, Cetak PDF (print stylesheet)

### 6.7 Notifikasi & Reminder (`/notifikasi`)

**Tujuan:** Pengingat jadwal operasional peternakan.

**Tipe Notifikasi:**
- `VAKSIN` — Jadwal vaksinasi
- `LAHIR` — Estimasi kelahiran
- `BERAT` — Jadwal penimbangan
- `CUSTOM` — Pengingat bebas

**Status:** Dibaca / Belum Dibaca (toggle)

### 6.8 Manajemen Farm (`/farm`) — Super Admin Only

**Tujuan:** CRUD lokasi farm.

**Data Farm:**
- `nama` — Nama farm
- `alamat` — Alamat lengkap
- `lat`, `lng` — Koordinat GPS
- `geojson` — Polygon kandang (GeoJSON)
- `deskripsi` — Keterangan tambahan
- `status` — AKTIF / NONAKTIF

**Info per Card Farm:** Jumlah hewan, jumlah pengguna terkait.

### 6.9 Peta GIS (`/map`)

**Tujuan:** Visualisasi geografis lokasi farm.

**Teknologi:** Leaflet.js + OpenStreetMap tiles

**Fitur:**
- Marker posisi setiap farm
- Polygon area kandang (dari GeoJSON field)
- Popup info farm saat klik marker
- Zoom ke lokasi

---

## 7. Komponen UI Library (Internal)

Semua komponen ada di `components/ui/`:

| Komponen | Deskripsi |
|----------|-----------|
| `Button` | Primary, outline, ghost, danger, success — size sm/md/lg/icon |
| `LinkButton` | Button yang bertindak sebagai `<Link>` (navigasi) |
| `Badge` | Status/kategori chip — variant: emerald, amber, rose, gray, dll |
| `DataTable` | Tabel data universal dengan kolom kustom dan empty state |
| `Modal` | Dialog overlay dengan close button, custom maxWidth |
| `ModalFooter` | Footer section modal (sticky, border-top) |
| `PageHeader` | Header section halaman (title, description, action slot) |
| `FormField` | Wrapper label + input + error message |
| `Alert` | Banner pesan error/info/success |
| `EmptyState` | Placeholder saat data kosong (dengan GoatIcon opsional) |
| `Card` | Container card dengan border dan padding |
| `AnimatedSection` | Wrapper dengan Framer Motion reveal animation |
| `GoatIcon` | Custom SVG icon kambing |

---

## 8. Design System Saat Ini (Genesis)

### Palet Warna
| Token | Hex | Penggunaan |
|-------|-----|------------|
| Primary | `#6366F1` (Indigo) | CTA, active state, link, focus ring |
| Primary Hover | `#4F46E5` | Hover pada elemen primary |
| Secondary | `#20970B` (Green) | Brand highlight |
| Neutral | `#9C9C9C` | Teks muted, placeholder, timestamp |
| Background | `#FAFAFA` | Background halaman |
| Surface | `#FFFFFF` | Card, panel, modal, nav |
| Text Primary | `#0A0A0A` | Heading, body text utama |
| Text Secondary | `#6B6B6B` | Deskripsi, metadata |
| Border | `#E8E8EC` | Divider, border card/input |
| Success | `#10B981` | Status published, konfirmasi |
| Warning | `#F59E0B` | Status pending, peringatan |
| Error | `#EF4444` | Aksi destruktif, error validasi |

### Tipografi
| Font | Penggunaan |
|------|------------|
| General Sans (Fontshare) | Display/heading — bold, tight tracking |
| DM Sans (Google Fonts) | Body/UI text — regular/medium |
| JetBrains Mono (Google Fonts) | Kode, tag hewan, CLI |

### Spacing & Radius
- Base unit: 4px
- Card radius: 12px
- Button/input radius: 6px
- Chip/badge radius: 4px
- Avatar radius: 9999px (circle)
- Container max-width: 1280px, padding 24px

### Layout Struktur
```
[Sidebar 260px] | [Content Area flex-1]
                   [Header 56px sticky]
                   [Main scroll area]
```

---

## 9. Masalah UI/UX yang Teridentifikasi

Berikut adalah masalah UI yang diakui sebagai "terlalu AI-generated":

1. **Warna Primary Indigo** — `#6366F1` adalah warna paling umum dipakai oleh template AI/SaaS. Terasa generic dan tidak mencerminkan identitas peternakan.

2. **Dot-grid background** — Pattern titik di halaman login adalah dekorasi paling klise template Next.js/Vercel.

3. **Sidebar sangat template** — Sidebar 260px putih dengan nav links icon+label adalah struktur yang dipakai oleh 90% template SaaS.

4. **Stat cards seragam** — Semua card bentuknya sama: icon kecil di pojok, angka besar, label kecil. Tidak ada variasi visual yang membuat satu metrik lebih penting dari yang lain.

5. **Header navbar sangat generic** — Height 56px, backdrop-blur, user avatar pill — semua ini adalah formula standar yang terlihat di mana-mana.

6. **Tidak ada identitas domain** — Tidak ada elemen visual yang menghubungkan aplikasi ini dengan konteks peternakan. Bisa dipakai untuk SaaS apa pun.

7. **Animasi standar** — `opacity: 0 → 1` + `y: 16 → 0` adalah animasi masuk yang dipakai oleh setiap template framer-motion.

---

## 10. Requirement Redesign UI/UX

### 10.1 Identitas Visual Baru
- Harus mencerminkan konteks **peternakan** — nuansa natural, agrikultur, earth-toned
- Bukan "tech startup look" — hindari indigo, purple, biru fintech
- Referensi mood: farm management, agtech profesional, bukan consumer app

### 10.2 Hal yang TIDAK Boleh Diubah
- Semua **data dan fungsionalitas** tetap identik
- Semua **route dan navigation structure** tetap sama
- Semua **server actions dan API** tidak disentuh
- Komponen `DataTable`, `Modal`, `PageHeader` bisa di-reskin tapi strukturnya dipertahankan
- **Responsiveness** harus tetap terjaga

### 10.3 Hal yang Boleh/Harus Diubah
- Seluruh **color palette** (ganti dari indigo ke warna yang lebih bermakna)
- **Typography** — bisa ganti ke font yang lebih berkarakter
- **Sidebar design** — variasikan layout, jangan template standar
- **Dashboard stat cards** — beri hirarki visual, variasi bentuk
- **Login page** — hapus dot-grid, buat lebih berkarakter
- **Animasi** — bisa lebih imajinatif dari sekedar fade+slide
- **Background** — tidak harus `#FAFAFA` polos

### 10.4 Panduan Arah Desain (Opsional, untuk konteks AI)
Beberapa referensi arah yang bisa dijadikan inspirasi:
- **Earth & Green** — Warm brown, sage green, cream — mencerminkan alam peternakan
- **Monochrome Bold** — Hitam, putih, satu accent bold (misalnya ochre/amber) — terlihat premium dan tegas
- **Deep Forest** — Dark green dominant, cream, gold accent — serius dan profesional untuk agtech

### 10.5 Anti-Pattern yang Harus Dihindari
- ❌ Indigo/violet sebagai warna primary
- ❌ Glassmorphism (backdrop-blur card)
- ❌ Bento grid layout
- ❌ Mesh/aurora gradient background
- ❌ Dot grid decorative pattern
- ❌ Generic "Standard Split" hero layout
- ❌ Rounded corners seragam di semua elemen (8px everywhere)
- ❌ Stat cards yang semuanya identik

---

## 11. Data Model Referensi Cepat

### Kategori Hewan
| Nilai | Keterangan |
|-------|-----------|
| `INDUKAN` | Betina dewasa, sudah/siap beranak |
| `PEJANTAN` | Jantan dewasa, untuk reproduksi |
| `ANAKAN` | Anak kambing (cempe), baru lahir |
| `DARA` | Betina muda, belum pernah beranak |
| `JANTAN_MUDA` | Jantan muda, belum jadi pejantan aktif |

### Status Hewan
| Nilai | Warna Badge |
|-------|-------------|
| `AKTIF` | Hijau |
| `MATI` | Merah |
| `TERJUAL` | Abu-abu |

### Status Reproduksi
| Nilai | Keterangan |
|-------|-----------|
| `HAMIL` | Sedang dalam masa kehamilan |
| `LAHIR` | Sudah melahirkan |
| `GAGAL` | Perkawinan gagal / keguguran |

### Tipe Notifikasi
| Nilai | Keterangan |
|-------|-----------|
| `VAKSIN` | Jadwal vaksinasi hewan |
| `LAHIR` | Estimasi kelahiran |
| `BERAT` | Jadwal penimbangan rutin |
| `CUSTOM` | Pengingat bebas dari pengguna |

---

## 12. Data Farm (Seed)

| Farm | Alamat | Koordinat |
|------|--------|-----------|
| Farm Alpha | Jl. Pegunungan No. 1, Lembang | -6.8175, 107.6191 |
| Farm Beta | Jl. Raya Ciwidey No. 42, Bandung | -7.0833, 107.4500 |
| Farm Gamma | Kp. Ternak Maju, Garut | -7.2278, 107.9086 |
| Farm Delta | Desa Hijau, Sumedang | -6.8381, 107.9253 |
| Farm Epsilon | Lembah Asri, Subang | -6.5614, 107.7597 |

Setiap farm memiliki 7 hewan dengan variasi: Pejantan, Indukan (×2), Anakan Jantan, Anakan Betina, Dara (Terjual), Jantan Muda (Mati).

---

## 13. Catatan Implementasi

- App menggunakan **Next.js Server Components** untuk data fetching — form submit lewat **Server Actions**
- Auth via `getSession()` — redirect ke `/login` jika tidak authenticated
- Farm filter untuk Super Admin dipass via `searchParams.farmId`
- Framer Motion dipakai untuk transisi halaman (`template.tsx`) dan animasi komponen
- Recharts untuk semua visualisasi data (pie chart, bar chart)
- Leaflet untuk peta GIS (client-side only)
- Print stylesheet sudah ada di halaman Laporan
