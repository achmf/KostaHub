# Pre-Development Plan: Export CSV Feature

**Status:** Planned  
**Target:** Halaman Daftar Hewan (`/hewan`)

## 1. Latar Belakang
Manajer farm dan pemilik peternakan seringkali membutuhkan data mentah dalam format tabular untuk diolah lebih lanjut menggunakan software *spreadsheet* seperti Microsoft Excel atau Google Sheets. Fitur "Export to CSV" adalah fitur esensial untuk kebutuhan ini.

## 2. Tech Stack & Pendekatan
Sesuai dengan filosofi *"Ponytail"* (malas, ringan, tanpa bloatware):
- **TIDAK menggunakan external library** (seperti `exceljs`, `papaparse`, atau `xlsx`).
- **Pendekatan:** Native Browser Web API.
  - JavaScript array manipulation (`map`, `join`).
  - Browser `Blob` API untuk membuat file lokal di memori klien.
  - HTML `<a>` (anchor tag) dengan atribut `download` untuk memicu penyimpanan file.

## 3. Desain Teknis (Algoritma)
1. **Data Gathers:** Mengambil `filtered` state dari React component yang sudah di-render di tabel. (Misal: data hewan yang sudah di-filter kategori/farm).
2. **Transformasi Format:**
   Membuat fungsi `downloadCSV(data, filename, headers)`:
   - Buat string header dipisah dengan koma (`,`).
   - Loop melalui data, escape karakter koma di dalam string dengan menggunakan _double quotes_ (`"text"`).
   - Gabungkan semuanya dengan baris baru (`\n`).
3. **Trigger Download:**
   ```javascript
   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.href = url;
   link.setAttribute('download', `${filename}.csv`);
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   ```

## 4. Rencana Implementasi UI
- Di halaman `/hewan`, tambahkan tombol **[Download CSV]** di sebelah tombol Filter/Tambah Hewan.

## 5. Keunggulan Pendekatan Ini
- **Zero Dependencies:** Ukuran bundle (JavaScript size) aplikasi sama sekali tidak bertambah. Sangat cepat.
- **Client-Side:** Beban export dilakukan di HP/Laptop pengguna, bukan di Server backend KostaHub. Menghemat *compute cost*.
