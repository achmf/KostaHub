# KostaHub — Product Requirements Document

> Versi: 1.0 (Production)
> Terakhir diperbarui: Oktober 2026
> Stack: Next.js 16 · React 19 · Prisma 6 · PostgreSQL (Neon) · TypeScript 5 · Tailwind CSS v4

---

## 1. Ringkasan Produk

**KostaHub** adalah aplikasi manajemen peternakan kambing berbasis web. Sistem ini dirancang untuk membantu peternak (Owner), petugas lapangan (Petugas), dan dinas pengawas (Dinas) dalam mengelola ternak secara terpusat — mulai dari pencatatan individu hewan, rekam medis, reproduksi, penimbangan berat badan, hingga laporan dan peta GIS.

Selain itu, terdapat panel **Super Admin** untuk mengelola seluruh peternakan (multi-farm) secara regional, menyetujui pendaftaran farm baru, memantau aktivitas, dan mengakses laporan lintas farm.

### Tujuan Utama
- Digitalisasi pencatatan ternak yang sebelumnya manual
- Memberikan visibilitas real-time kondisi kesehatan, reproduksi, dan populasi hewan
- Memungkinkan deteksi dini potensi masalah (wabah, kawin sedarah, penimbangan tertunda)
- Menyediakan laporan yang dapat diekspor untuk keperluan dinas dan administrasi

---

## 2. Peran Pengguna (Role)

Sistem memiliki 4 role utama yang didefinisikan di database:

| Role | Nama Tampilan | Deskripsi |
|------|---------------|-----------|
| `SUPER_ADMIN` | Super Admin | Akses penuh ke semua farm, semua data, dan panel admin regional |
| `OWNER` | Owner | Pemilik farm; bisa mengelola staff, mendaftarkan farm baru, melihat semua data farmnya |
| `PETUGAS` | Petugas | Staff lapangan; input data hewan, medis, reproduksi, berat badan |
| `DINAS` | Dinas | Akses view-only ke peta dan laporan; tidak bisa mengedit data |

### Perbandingan Akses per Role

| Fitur | Super Admin | Owner | Petugas | Dinas |
|-------|:-----------:|:-----:|:-------:|:-----:|
| Dashboard | ✅ (semua farm) | ✅ (farm aktif) | ✅ (farm aktif) | ✅ |
| Manajemen Hewan | ✅ | ✅ | ✅ | ❌ |
| Rekam Medis | ✅ | ✅ | ✅ | ❌ |
| Reproduksi | ✅ | ✅ | ✅ | ❌ |
| Berat Badan | ✅ | ✅ | ✅ | ❌ |
| Notifikasi | ✅ | ✅ | ✅ | ❌ |
| Peta GIS | ✅ | ✅ | ❌ | ✅ |
| Laporan + Export | ✅ | ✅ | ❌ | ✅ |
| Kelola Staff | ❌ | ✅ | ❌ | ❌ |
| Farm Picker | N/A | ✅ | ✅ | ✅ |
| Admin Dashboard | ✅ | ❌ | ❌ | ❌ |
| Approval Farm | ✅ | ❌ | ❌ | ❌ |
| Manajemen Users | ✅ | ❌ | ❌ | ❌ |
| Activity Log | ✅ | ❌ | ❌ | ❌ |
| Laporan Regional | ✅ | ❌ | ❌ | ❌ |
| Pengumuman | ✅ (kirim) | ✅ (lihat) | ✅ (lihat) | ✅ |
| Manajemen Farm (admin) | ✅ | ❌ | ❌ | ❌ |

---

## 3. Arsitektur Sistem

### 3.1 Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Framework | Next.js | 16.2.4 |
| Runtime | React | 19.2.4 |
| Bahasa | TypeScript | ^5 |
| Database | PostgreSQL via Neon | — |
| ORM | Prisma | ^6.19.3 |
| Auth | JWT (HS256) via `jose` | ^6.2.3 |
| CSS | Tailwind CSS v4 + CSS custom props | ^4.2.2 |
| Animasi | Framer Motion | ^12.38.0 |
| Chart | Recharts | ^3.8.1 |
| Peta | Leaflet + react-leaflet | ^1.9.4 / ^5.0.0 |
| Push Notif | web-push (VAPID) | ^3.6.7 |
| Export | ExcelJS | ^4.4.0 |
| Validasi | Zod | ^4.6.5 |
| Password | bcryptjs | ^3.0.3 |
| UI Primitives | Base UI (`@base-ui/react`) | ^1.5.0 |
| Komponen tambahan | shadcn/ui (Sonner, etc.) | ^4.7.0 |
| Icons | Lucide React | ^1.16.0 |
| Deploy | Vercel + Neon Postgres | — |

### 3.2 Pola Arsitektur

- **Server Components** (default): semua halaman fetch data server-side via Prisma
- **Server Actions**: semua mutasi (create, update, delete) lewat Server Actions, tidak ada REST endpoint untuk mutasi
- **Client Components** (`'use client'`): hanya untuk interaksi UI (tabel dengan filter, chart, animasi, modal)
- **Auth**: JWT disimpan di cookie `session` (httpOnly); didecode lewat `getSession()` yang di-cache per-request via React `cache()`
- **Cache**: `next/cache` revalidatePath + `unstable_cache` (via `lib/cached-queries.ts`) untuk dashboard data

### 3.3 Route Groups & Layout

```
/                         → redirect ke /farms atau /dashboard
/login                    → halaman login (public)
/register                 → pendaftaran akun Owner baru (public)

/farms                    → Farm Picker (pilih farm aktif)
/farms/new                → Form pendaftaran farm baru (Owner only)
/farms/revisi/[farmId]    → Revisi farm yang ditolak (Owner only)

/(dashboard)/             → Dashboard utama (protected)
/(dashboard)/hewan        → Daftar hewan
/(dashboard)/hewan/[id]   → Detail hewan
/(dashboard)/hewan/tambah → Tambah hewan baru
/(dashboard)/medis        → Riwayat kesehatan semua hewan
/(dashboard)/medis/tambah → Tambah rekam medis
/(dashboard)/reproduksi   → Daftar kejadian reproduksi
/(dashboard)/reproduksi/tambah → Tambah kejadian kawin/lahir
/(dashboard)/berat        → Monitoring berat badan
/(dashboard)/notifikasi   → Daftar notifikasi
/(dashboard)/laporan      → Laporan farm + export Excel
/(dashboard)/map          → Peta GIS farm (Leaflet)
/(dashboard)/profil       → Profil akun pengguna
/(dashboard)/staff        → Kelola staff (Owner only)
/(dashboard)/farm         → Daftar semua farm (Super Admin only)

/admin/                   → Admin Dashboard (Super Admin only)
/admin/users              → Manajemen user
/admin/farms              → Manajemen farm
/admin/farms/[id]         → Detail farm
/admin/approvals          → Approval pendaftaran farm
/admin/laporan            → Laporan regional (semua farm)
/admin/map                → Peta regional
/admin/announcements      → Kirim pengumuman push notif
/admin/activity           → Activity log sistem
/admin/profil             → Profil Super Admin
```

### 3.4 API Routes

| Method | Path | Fungsi |
|--------|------|--------|
| `GET` | `/api/notifikasi` | Fetch notifikasi + auto-generate dari kondisi farm |
| `POST` | `/api/notifikasi/read` | Mark notifikasi sebagai sudah dibaca |
| `POST` | `/api/check-inbreeding` | Cek potensi kawin sedarah (inbreeding detection) |
| `GET` | `/api/farm/laporan/export` | Export laporan farm ke file `.xlsx` |
| `POST` | `/api/push` | Kirim push notification ke subscriber |
| `GET/POST` | `/api/push/subscribe` | Subscribe/unsubscribe Web Push |
| `POST` | `/api/admin/send-announcement` | Kirim pengumuman ke semua subscriber |
| `GET` | `/api/hewan/[id]/foto` | Upload/update foto hewan |

---

## 4. Autentikasi & Otorisasi

### 4.1 Alur Login

1. User memasukkan email + password di `/login`
2. Server Action `login` memverifikasi dengan `bcryptjs`
3. JWT (HS256, expire 24 jam) dibuat dan disimpan di cookie `session`
4. `SessionPayload` berisi: `id`, `name`, `email`, `role`, `activeFarmId`
5. Redirect ke `/farms` (farm picker) atau `/dashboard`

### 4.2 Alur Registrasi Owner Baru

1. User mendaftar di `/register` dengan nama, email, password, dan nomor telepon
2. Akun dibuat dengan `approvalStatus: PENDING`
3. Owner diarahkan ke `/farms/new` untuk mendaftarkan farm
4. Farm dibuat dengan `status: NONAKTIF`
5. Super Admin mereview dan menyetujui/menolak di `/admin/approvals`
6. Jika ditolak, Owner bisa merevisi di `/farms/revisi/[farmId]`

### 4.3 Farm Context

- User dapat memiliki lebih dari satu farm (many-to-many via `UserFarm`)
- User memilih farm aktif melalui Farm Picker (`/farms`)
- `activeFarmId` disimpan di JWT session
- Super Admin bisa melihat data semua farm via `?farmId=<id>` searchParam

### 4.4 Middleware Auth

Tidak ada Next.js middleware file. Proteksi dilakukan di layout dan page level:
- `app/(dashboard)/layout.tsx`: `getSession()` → redirect ke `/login` jika null
- `app/admin/layout.tsx`: cek `session.role === 'SUPER_ADMIN'` → redirect jika bukan
- Server Actions menggunakan HOF `withAuth()` dari `lib/auth.ts`

---

## 5. Fitur Per Modul

### 5.1 Dashboard (`/`)

**Ditampilkan:** Semua role dengan farm aktif

**Data yang ditampilkan:**
- Stat cards: Total hewan aktif, Indukan, Pejantan, Kematian
- KPI cards: Mortality rate, Birth success rate, Rata-rata berat badan
- Chart: Distribusi kategori hewan (Pie chart)
- Chart: Distribusi umur hewan (Bar chart)
- Chart: Tren populasi hewan per bulan (Area/Line chart) — filter 1 bln / 3 bln / 6 bln / 1 thn / custom range
- Chart: Tren kematian per bulan (Line chart)
- Chart: Tren berat badan rata-rata (Area chart)
- Chart: Top 5 diagnosa paling sering (Bar chart)
- Tabel: Kehamilan yang sedang berjalan (estimasi lahir + nama induk)
- Tabel: Notifikasi medis yang mendekati jadwal kontrol
- Stat: Total lahir, total gagal, total sedang hamil dalam periode

**Filter waktu:** Preset (1 bln, 3 bln, 6 bln, 1 thn) + Custom Range Calendar

**Super Admin:** bisa memilih farm via `?farmId` searchParam; stat card tambahan jumlah total farm

### 5.2 Manajemen Hewan (`/hewan`)

**CRUD:**
- **List** — Tabel semua hewan dalam farm aktif dengan:
  - Filter: Kategori, Status (Hidup/Mati), Kelamin
  - Search: tag, nama hewan
  - Pagination (server-side)
  - Badge kategori berwarna (Indukan/Pejantan/Anakan/Dara/Jantan Muda)
  - Badge status Hidup/Mati
  - Kolom: Tag, Nama, Kategori, Kelamin, Berat, Status
- **Detail** (`/hewan/[id]`) — menampilkan:
  - Profil lengkap: foto, tag, nama, kelamin, kategori, tanggal lahir, umur
  - Riwayat berat badan (5 terbaru)
  - Riwayat rekam medis (5 terbaru)
  - **Silsilah/Family Tree** — pohon leluhur multi-generasi (streaming via `<Suspense>`)
  - RFID tag management (pasang/copot tag RFID via Web NFC)
  - Tombol batalkan kematian (jika hewan sudah ditandai mati)
  - Status kematian dengan penyebab (jika mati)
- **Tambah** (`/hewan/tambah`) — form: tag, nama, kelamin, kategori, tanggal lahir, berat awal, foto, pilih induk (betina) & pejantan (opsional)
- **Edit** (`/hewan/[id]/edit`) — sama dengan tambah
- **Transfer hewan antar farm** — via action `transferHewan` (Super Admin/Owner)
- **Catat kematian** — form dengan penyebab (Penyakit/Kecelakaan/Usia Tua/Melahirkan/Lainnya) + catatan
- **Update foto** — upload foto dari detail page

**Foto:** Disimpan di Vercel Blob atau lokal `/public/uploads/`

### 5.3 Rekam Medis (`/medis`)

**List halaman:**
- Stat cards: Total catatan, Vaksinasi, Tindakan unik, Dokter terlibat
- Tabel daftar hewan beserta rekam medis terbaru (expand per hewan)

**Tambah rekam medis (`/medis/tambah`):**
- Pilih hewan (dengan search)
- Tanggal pemeriksaan
- Kategori tindakan (enum `KategoriMedis`): Vaksinasi, Pengobatan, Pengobatan Infeksi, Pengobatan Parasit, Pemeriksaan, Pemeriksaan Rutin, Perawatan Luka, Vitamin, Partus, Potong Kuku, Lainnya
- Diagnosis (teks bebas)
- Obat (opsional)
- Dokter: pilih user sistem (via dropdown) ATAU nama dokter eksternal (teks bebas)
- Catatan (opsional)
- Foto (opsional)
- Tanggal kontrol lanjut (opsional) + flag `butuhNotifikasi`

**Edit rekam medis:** tersedia di halaman detail hewan

**Kategori medis yang menghasilkan notifikasi otomatis:**
Jika `butuhNotifikasi = true` dan `tanggalLanjut` diisi, sistem akan auto-generate notifikasi tipe `MEDIS` ketika tanggal lanjut ≤ 3 hari dari sekarang.

### 5.4 Reproduksi (`/reproduksi`)

**List:**
- Stat cards: Total kawin, Sedang hamil, Total lahir, Total gagal
- Tabel dengan filter status (Hamil/Lahir/Gagal)
- Badge status berwarna

**Tambah reproduksi (`/reproduksi/tambah`):**
- Pilih induk (betina, bukan jantan) dengan `HewanSelector`
- Pilih pejantan dengan `HewanSelector`
- **Cek inbreeding otomatis**: saat pejantan dipilih, sistem otomatis memanggil `/api/check-inbreeding` dan menampilkan warning jika ditemukan leluhur bersama (kawin sedarah)
- Tanggal kawin
- Estimasi lahir (auto-hitung 5 bulan dari tanggal kawin, bisa diubah)
- Status awal: `HAMIL`

**Update status reproduksi:**
- `HAMIL` → `LAHIR`: Form input data anak yang lahir (tag anak, opsional link ke record hewan baru)
- `HAMIL` → `GAGAL`: Catatan kegagalan
- Anak yang lahir bisa langsung diregistrasi ke sistem sebagai hewan baru

**Inbreeding Detection:**
- Algoritma traversal ancestor via `lib/silsilah.ts` → `getAncestorIds()`
- Mengambil semua leluhur (tidak terbatas generasi) dari kedua hewan
- Mencari irisan leluhur bersama
- Jika ada irisan → `inbreedingWarning: true` disimpan di record `Reproduksi`
- Warning ditampilkan dengan nama/tag leluhur bersama

### 5.5 Berat Badan (`/berat`)

- List semua hewan hidup dalam farm dengan berat terakhir dan tanggal timbang
- Form catat berat baru: pilih hewan (search), input berat (kg), tanggal, catatan
- Riwayat penimbangan per hewan (5 terbaru di detail hewan)
- Notifikasi otomatis: hewan yang tidak ditimbang >30 hari akan auto-generate notifikasi tipe `BERAT`

### 5.6 Notifikasi (`/notifikasi`)

**Sistem notifikasi dua lapis:**

**Layer 1 — In-app notifikasi (database):**
- Data di-fetch client-side via `GET /api/notifikasi`
- Setiap kali di-fetch, sistem otomatis men-generate notifikasi baru dari kondisi farm:
  - **MEDIS**: Rekam medis dengan `tanggalLanjut` ≤ 3 hari ke depan
  - **LAHIR**: Reproduksi `HAMIL` dengan `estimasiLahir` ≤ 7 hari ke depan
  - **BERAT**: Hewan hidup yang tidak diupdate >30 hari
- Filter tampilan: ALL / MEDIS / VAKSIN / LAHIR / BERAT / CUSTOM
- Mark as read per notifikasi atau bulk

**Layer 2 — Web Push Notification (browser):**
- VAPID-based push via `web-push`
- User bisa subscribe notifikasi browser dari halaman Profil
- Super Admin bisa kirim push announcement manual dari `/admin/announcements`
- Push dikirim ke semua subscriber saat ada pengumuman baru

### 5.7 Peta GIS (`/map`)

**Akses:** Owner, Dinas, Super Admin (Petugas diblok)

**Fitur:**
- Peta interaktif Leaflet dengan marker per farm
- Setiap marker menampilkan: nama farm, hewan aktif, hewan mati, indukan, pejantan
- Polygon kandang (GeoJSON) — bisa digambar/diedit oleh Super Admin via `/admin/farms/[id]`
- Super Admin: bisa melihat semua farm atau filter by `?farmId`
- Owner: hanya farmnya sendiri
- Cluster marker otomatis via `react-leaflet-cluster`

### 5.8 Laporan (`/laporan`)

**Akses:** Owner, Dinas, Super Admin

**Tab laporan:**

1. **Status & Riwayat Ternak** (`keluar-masuk`):
   - Hewan masuk (ditambahkan ke sistem)
   - Hewan keluar (mati atau terjual)
   - Mutasi/transfer antar farm
   - Filter by tanggal

2. **Rekam Medis** (`medis`):
   - Semua rekam medis dalam periode
   - Distribusi per kategori tindakan
   - Top diagnosa
   - Mini line chart tren per bulan
   - Sortable columns

3. **Reproduksi & Breeding** (`breeding`):
   - Semua kejadian reproduksi
   - Status distribusi (Hamil/Lahir/Gagal)
   - Daftar hewan yang sedang hamil
   - Filter status

4. **Pertumbuhan Berat** (`pertumbuhan`):
   - Tabel berat terbaru per hewan
   - Delta berat (kenaikan/penurunan)
   - Trend chart berat rata-rata per bulan
   - Filter kategori hewan

**Export Excel:**
- Tombol "Unduh Laporan .xlsx" di header laporan
- Memanggil `GET /api/farm/laporan/export?farmId=...`
- File diunduh langsung sebagai `KostaHub-Laporan-[NamaFarm]-[tanggal].xlsx`
- Format ExcelJS dengan multiple sheets

### 5.9 Profil (`/profil`)

- Lihat dan edit data profil: nama, email, nomor telepon
- Ganti password (verifikasi password lama)
- Subscribe/unsubscribe Web Push notification
- Tampilan QR Code user ID

### 5.10 Kelola Staff (`/staff`)

**Akses:** Owner only

- List semua Petugas yang terhubung ke farm aktif
- Tambah staff: input email → sistem mencari user terdaftar → assign ke farm
- Hapus staff dari farm (unlink, bukan delete user)
- Hanya menampilkan user dengan `role: PETUGAS` dan `approvalStatus: APPROVED`

---

## 6. Modul Admin (Super Admin Only)

### 6.1 Admin Dashboard (`/admin`)

**Bagian atas — Dashboard operasional:**
- Stat cards: Total farm aktif, Total hewan, Total mati, Total user, Total rekam medis
- Trend card: perbandingan populasi vs bulan lalu (% naik/turun)
- Farm Comparison chart: hewan aktif per farm (Bar chart)
- Distribusi kategori hewan per farm (stacked)
- Top Diagnosa sistem-wide (Pie chart)
- Farm Alerts: farm dengan mortality rate tinggi, farm tidak aktif, farm dengan hewan banyak sakit
- Tabel pending approval terbaru

**Bagian bawah — Analytics (`#analytics`):**
- Hewan per farm (distribusi)
- Reproduksi per farm (status distribusi)
- Distribusi umur hewan (global)
- Top diagnosa (treemap/bar)
- Kategori medis breakdown

### 6.2 Manajemen Users (`/admin/users`)

- Stat: Total user, Owner, Petugas
- Tabel semua user (non-deleted) dengan info: nama, email, role, approval status, farm yang diassign
- Approve/reject user
- Tambah user baru (Super Admin)
- Edit user (role, status)
- Soft-delete user (`deletedAt`)

### 6.3 Manajemen Farm (`/admin/farms`)

- Daftar semua farm dengan status (AKTIF/NONAKTIF/DELETED)
- Jumlah hewan dan anggota per farm
- Detail farm (`/admin/farms/[id]`):
  - Edit informasi farm (nama, alamat, deskripsi)
  - Gambar/edit polygon GeoJSON kandang di peta
  - Lihat daftar hewan farm
  - Lihat daftar member farm

### 6.4 Approval Pendaftaran Farm (`/admin/approvals`)

- List semua farm berstatus `NONAKTIF` (pending approval)
- Informasi per card: nama farm, owner, alamat, deskripsi, tanggal daftar, sertifikat farm
- Action: **Approve** (set status AKTIF) atau **Reject** (isi alasan penolakan)
- Jika ditolak: Owner mendapat notifikasi dan bisa merevisi via `/farms/revisi/[farmId]`

### 6.5 Laporan Regional (`/admin/laporan`)

- Ringkasan eksekutif: total farm, farm aktif, total hewan, total kematian, total staf, rekam medis
- Tabel detail per farm: Hewan aktif, Kematian, Hamil, Rekam Medis, Mortality %, Staf
- Color-coded mortality: >15% = merah, 7-15% = oranye, <7% = hijau
- Row totals di footer tabel
- Tombol **Export Excel** regional (semua farm)

### 6.6 Activity Log (`/admin/activity`)

- Feed aktivitas terbaru dari seluruh sistem (100 item terakhir)
- Jenis event yang ditampilkan:
  - Hewan baru ditambahkan
  - Rekam medis baru
  - Registrasi farm baru
  - Registrasi user baru
  - Reproduksi event (kawin, lahir, gagal)
- Setiap item: label farm, timestamp relatif, icon tipe event
- Filter by farm

### 6.7 Pengumuman (`/admin/announcements`)

- Super Admin: form kirim pengumuman (judul + pesan) → terkirim sebagai push notification ke semua subscriber browser
- Semua role: lihat riwayat pengumuman yang pernah dikirim

---

## 7. Alur Registrasi & Onboarding

```
[User baru] → /register (isi data diri)
    ↓
[Akun PENDING] → /farms/new (daftarkan farm pertama)
    ↓
[Farm NONAKTIF] → menunggu approval Super Admin
    ↓
[Super Admin: /admin/approvals] → Approve / Reject
    ↓
[APPROVE] → Farm AKTIF → Owner bisa login ke dashboard
[REJECT]  → Owner terima notifikasi alasan → /farms/revisi/[farmId] → re-submit
```

---

## 8. Design System (KostaHub Visual Language)

### 8.1 Color Palette

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `cream` | `#F2EDE0` | Background utama halaman login, farm picker |
| `cream-soft` | `#FBF8EF` | Background card/section sekunder |
| `forest` | `#1B2A1F` | Background dark (sidebar, stat cards gelap) |
| `moss` | `#3F5B3A` | Primary action color, badge Indukan |
| `moss-soft` | `#A5B5A0` | Disabled states, subtle indicators |
| `ochre` | `#C7873E` | Accent/highlight, badge Owner |
| `ochre-soft` | `#E2B883` | Hover ochre, light badges |
| `ink` | `#0D140F` | Teks utama hampir semua halaman |
| `border` | `rgba(13,20,15,0.10)` | Semua borders default |
| `border-strong` | `rgba(13,20,15,0.18)` | Border emphasis |
| `rose` | `#B5443B` | Error, kematian, danger |
| `amber` | `#D9A23C` | Warning, birth success rate |
| `emerald` | `#3F7A4E` | Success, badge Dara/Hidup |

### 8.2 Tipografi

| Font | Variabel | Penggunaan |
|------|----------|-----------|
| **Fraunces** (Google Fonts) | `--font-serif` | Heading utama halaman, angka besar di stat cards |
| **Inter** (Google Fonts) | `--font-sans` | Teks body, label form, konten tabel |
| **JetBrains Mono** (Google Fonts) | `--font-mono` | Label uppercase kecil, tag, kode, badge status |

### 8.3 Komponen KostaUI

File [`components/KostaUI.tsx`](file:///c:/Dev/KostaHub/components/KostaUI.tsx) mengekspor komponen standar:

| Komponen | Deskripsi |
|----------|-----------|
| `KostaPageHeader` | Header halaman: label mono kecil + judul Fraunces + deskripsi + slot action |
| `KostaCard` | Container dengan border, background putih, border-radius 16px |
| `KostaButton` | Primary button (forest background, cream text) |
| `KostaSpinner` | Loading spinner |
| `KostaEmptyState` | State kosong (icon + judul + deskripsi) |
| `KostaSectionLabel` | Label bagian: JetBrains Mono uppercase kecil |
| `Badge` | Colored badge dengan 8 variant: `emerald`, `amber`, `rose`, `ochre`, `moss`, `ink`, `cream`, `default` |
| `palette` | Exported color tokens sebagai JS object |

### 8.4 Animasi

- Page transitions: `framer-motion` di `template.tsx` (fade + translate Y)
- Komponen masuk: `opacity: 0→1` + `y: 16→0` dengan stagger delay
- Interactive: hover scale, button active scale
- Chart: animated counter (`animate()` dari framer-motion untuk angka stat)

### 8.5 Layout

```
[Sidebar 260px fixed] | [Content Area flex-1]
                          [Header 56px sticky, backdrop-blur]
                          [Main scroll area, max-width 1280px, padding 24px]
```

- Sidebar: dark forest background, logo, nav links dengan icon + label
- Header: breadcrumb, notifikasi bell (badge count), user avatar
- Responsive: sidebar collapse ke bottom nav pada mobile

---

## 9. Data Model Referensi

### 9.1 Enum

#### Role
| Nilai | Keterangan |
|-------|-----------|
| `SUPER_ADMIN` | Administrator regional sistem |
| `OWNER` | Pemilik peternakan |
| `PETUGAS` | Staff lapangan |
| `DINAS` | Pejabat dinas (view-only) |

#### KategoriHewan
| Nilai | Keterangan |
|-------|-----------|
| `INDUKAN` | Betina dewasa, sudah/siap beranak |
| `PEJANTAN` | Jantan dewasa, untuk reproduksi |
| `ANAKAN` | Anak kambing (cempe), baru lahir |
| `DARA` | Betina muda, belum pernah beranak |
| `JANTAN_MUDA` | Jantan muda, belum jadi pejantan aktif |

#### StatusHewan (derived dari kematian record)
| Kondisi | Badge |
|---------|-------|
| `kematian == null` | `Hidup` (emerald) |
| `kematian != null` | `Mati` (rose) |

#### KategoriMedis
| Nilai | Label UI |
|-------|---------|
| `VAKSINASI` | Vaksinasi |
| `PENGOBATAN` | Pengobatan |
| `PENGOBATAN_INFEKSI` | Pengobatan Infeksi |
| `PENGOBATAN_PARASIT` | Pengobatan Parasit |
| `PEMERIKSAAN` | Pemeriksaan |
| `PEMERIKSAAN_RUTIN` | Pemeriksaan Rutin |
| `PERAWATAN_LUKA` | Perawatan Luka |
| `VITAMIN` | Vitamin |
| `PARTUS` | Partus |
| `POTONG_KUKU` | Potong Kuku |
| `LAINNYA` | Lainnya |

#### StatusReproduksi
| Nilai | Keterangan |
|-------|-----------|
| `HAMIL` | Sedang dalam masa kehamilan |
| `LAHIR` | Sudah melahirkan |
| `GAGAL` | Perkawinan gagal / keguguran |

#### TipeNotifikasi
| Nilai | Trigger |
|-------|---------|
| `MEDIS` | Jadwal kontrol medis ≤ 3 hari |
| `VAKSIN` | Jadwal vaksinasi (manual/custom) |
| `LAHIR` | Estimasi kelahiran ≤ 7 hari |
| `BERAT` | Hewan tidak ditimbang >30 hari |
| `CUSTOM` | Notifikasi manual dari user |

#### PenyebabKematian
| Nilai | Label UI |
|-------|---------|
| `PENYAKIT` | Penyakit |
| `KECELAKAAN` | Kecelakaan |
| `USIA_TUA` | Usia Tua |
| `MELAHIRKAN` | Komplikasi Melahirkan |
| `LAINNYA` | Lainnya |

#### StatusTagRfid
| Nilai | Keterangan |
|-------|-----------|
| `AKTIF` | Tag sedang terpasang dan berfungsi |
| `HILANG` | Tag tidak ditemukan |
| `RUSAK` | Tag tidak berfungsi |
| `DICOPOT` | Tag sengaja dilepas |

#### FarmStatus
| Nilai | Keterangan |
|-------|-----------|
| `AKTIF` | Farm telah disetujui Super Admin |
| `NONAKTIF` | Menunggu approval atau disuspend |
| `DELETED` | Farm dihapus (soft delete) |

#### ApprovalStatus (untuk User)
| Nilai | Keterangan |
|-------|-----------|
| `PENDING` | Menunggu review |
| `APPROVED` | Disetujui |
| `REJECTED` | Ditolak |

### 9.2 Relasi Antar Model

```
User ←→ Farm          (many-to-many via UserFarm)
Farm ←→ Hewan         (one-to-many)
Hewan ←→ Hewan        (self-referential: bapak/induk untuk silsilah)
Hewan ←→ RekamMedis   (one-to-many)
Hewan ←→ BeratBadan   (one-to-many)
Hewan ←→ TagRfid      (one-to-many)
Hewan ←→ KematianHewan (one-to-one)
Hewan ←→ Reproduksi   (induk: one-to-many, pejantan: one-to-many, anak: one-to-one)
Farm ←→ TransferHewan  (fromFarm / toFarm)
Farm ←→ Notifikasi    (one-to-many)
User ←→ RekamMedis    (dokter internal, optional)
```

---

## 10. Fitur Khusus & Business Logic

### 10.1 Silsilah (Ancestry Tree)

- Setiap hewan bisa memiliki referensi `bapakId` dan `indukId`
- `lib/silsilah.ts` → `buildSilsilahTree()`: traversal rekursif ke atas membangun pohon leluhur
- `getAncestorIds()`: mengumpulkan semua ID leluhur (tanpa batas kedalaman) untuk inbreeding check
- Ditampilkan di halaman detail hewan via komponen `<SilsilahTree>` dengan streaming `<Suspense>`

### 10.2 Inbreeding Detection

- Triggered otomatis saat memilih pasangan reproduksi
- API `POST /api/check-inbreeding` menerima `indukId` + `pejantanId`
- Mengambil semua ancestor kedua hewan dan mencari irisan
- Jika ada leluhur bersama → warning ditampilkan dengan nama/tag hewan yang menjadi common ancestor
- Field `inbreedingWarning: Boolean` disimpan di tabel `Reproduksi`

### 10.3 RFID Tag Management

- Setiap hewan bisa memiliki banyak `TagRfid` records (riwayat)
- Hanya satu tag berstatus `AKTIF` per hewan pada satu waktu
- Pembacaan RFID via Web NFC API (`hooks/useWebNFC.ts`):
  - Hanya tersedia di Chrome for Android
  - `NDEFReader` API untuk baca UID chip NFC
  - Komponen `HybridTagManager` di halaman detail hewan: scan atau input manual
- UID disimpan sebagai string unik di `TagRfid.rfidUid`

### 10.4 Notifikasi Otomatis (Auto-Generator)

Setiap `GET /api/notifikasi` memanggil `generateNotifikasiOtomatis()`:
- Deduplication via message key: `[ref:MEDIS-{id}]`, `[ref:LAHIR-{id}]`, `[ref:BERAT-{id}]`
- Hanya create jika belum ada notifikasi dengan key yang sama
- Max 20 item per kategori per run (throttle untuk performa)

### 10.5 Export Excel

- Menggunakan `exceljs` library
- Multi-sheet: Overview, Data Hewan, Rekam Medis, Reproduksi, Berat Badan
- Styling cell: header bold, auto-width kolom, zebra rows
- Endpoint: `GET /api/farm/laporan/export?farmId=<id>`

### 10.6 Caching

- Dashboard data di-cache menggunakan `unstable_cache` (`lib/cached-queries.ts`)
- Revalidasi via `revalidatePath()` setelah mutasi (tambah/edit/hapus hewan, medis, dll)
- `invalidateHewan()` dan `invalidateFarm()` di `lib/cache-invalidation.ts`
- `getSession()` menggunakan React `cache()` — JWT hanya di-decode sekali per request meski dipanggil di layout + page

---

## 11. Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `DIRECT_URL` | Direct PostgreSQL URL untuk Prisma migration |
| `JWT_SECRET` | Secret key untuk JWT signing |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key untuk Web Push |
| `VAPID_PRIVATE_KEY` | VAPID private key untuk Web Push |
| `VAPID_EMAIL` | Email VAPID (format: `mailto:admin@...`) |
| `BLOB_READ_WRITE_TOKEN` | Token untuk Vercel Blob (upload foto) |
| `SMTP_HOST` | SMTP server untuk email notifikasi |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `NEXT_PUBLIC_APP_URL` | Base URL aplikasi (untuk email links) |

---

## 12. Catatan Implementasi

- App menggunakan **Next.js Server Components** untuk data fetching — form submit lewat **Server Actions**
- Auth via `getSession()` — JWT di cookie `session`, redirect ke `/login` jika tidak authenticated
- Farm filter untuk Super Admin dipass via `searchParams.farmId`
- Framer Motion dipakai untuk transisi halaman (`template.tsx`) dan animasi komponen
- Recharts untuk semua visualisasi data (pie chart, bar chart, area chart, line chart)
- Leaflet untuk peta GIS (client-side only, di-load dinamis via `dynamic()` import)
- Print stylesheet tersedia di halaman Laporan (`/laporan`)
- Service layer di `services/` memisahkan business logic dari action handlers
- Validasi form menggunakan Zod di `lib/validations/`
- Upload file: disimpan di `public/uploads/` (lokal) — belum menggunakan cloud storage untuk foto hewan
- Web Push menggunakan standar VAPID; service worker di `public/sw.js`
- `tsconfig.tsbuildinfo` dan `.agents/` di-ignore git (file build cache dan AI config)
