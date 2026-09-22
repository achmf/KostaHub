# Pre-Development Plan: RFID & QR Code Hybrid Integration

**Status:** Planned (Hardware Integration)  
**Target:** Integrasi Sistem Fisik Kandang dengan KostaHub Web App

## 1. Latar Belakang & Konsep Dasar
Pencatatan data hewan peternakan manual (mengandalkan visual Tag Telinga KST-10023) sering kali rawan salah ketik (*human error*), memakan waktu, dan tidak efisien untuk kandang berskala besar. 

**Solusi Hibrida (RFID + QR Code):**
Mengingat tidak semua peternak atau pekerja kandang memiliki perangkat *Handheld Scanner* RFID atau *Smartphone* dengan fitur NFC, kita akan menggunakan pendekatan ganda:
1. Setiap hewan dipasangkan **Kartu/Tag RFID yang di permukaannya telah dicetak QR Code** secara permanen (misal: *laser-engraved*).
2. **Jalur Cepat (RFID):** Bagi petugas yang memiliki *Handheld RFID Reader*, alat cukup ditempelkan atau diarahkan ke tag. Sistem otomatis membaca kode seri (UID) dan mengirimkan *input* seolah-olah mengetikkan Tag ID ke Web App KostaHub.
3. **Jalur Alternatif (QR Code):** Bagi petugas yang hanya membawa HP standar tanpa NFC/Reader, mereka cukup membuka aplikasi kamera bawaan HP, lalu memindai gambar QR Code pada tag tersebut. QR Code akan mengarahkan browser langsung ke halaman profil kambing (misal: `kostahub.com/hewan/[id]`).

## 2. Tech Stack & Software
Pendekatan ini sangat **low-effort namun high-impact** sesuai filosofi *Ponytail*:

- **Backend / Database:** Menambahkan kolom `rfid_uid` (String, nullable) di tabel `Hewan` pada Prisma schema.
- **Frontend (KostaHub Web):** 
  - **Untuk RFID:** Cukup letakkan elemen `<input autoFocus />` tersembunyi di halaman pencarian. Sebagian besar RFID reader bertindak sebagai *Keyboard Emulator* (Bluetooth HID). Reader akan menembakkan *string* (contoh: `0123456789`) dan diakhiri tombol `Enter` secara otomatis.
  - **Untuk QR Code:** Web app akan men-*generate* desain QR Code menggunakan *library* ringan seperti `qrcode.react` di halaman admin. Admin bisa mendownload gambar QR Code ini untuk diserahkan ke jasa percetakan kartu/tag RFID agar QR tersebut di-print ke fisik kartu RFID.

## 3. Jenis Hardware (Bisa Dibeli di Marketplace)

### A. Kartu/Tag Hybrid (RFID + QR Code)
**Yang harus dibeli:** *Blank RFID Ear Tag* atau *RFID PVC Card*.
- **Frekuensi:** **UHF (860-960 MHz)** (baca jarak jauh 1-3 meter) atau **LF (134.2 KHz / FDX-B)** (baca jarak dekat 5-10 cm).
- **Proses Pencetakan QR:** Beli tag RFID polos berwarna terang (kuning/putih), lalu gunakan jasa *Laser Engraving* atau cetak stiker vinyl *waterproof* untuk menempelkan gambar QR Code spesifik kambing tersebut ke atas tag.
- **Kata Kunci Pencarian:** "Blank RFID Ear Tag", "Kartu RFID Putih Polos", "Jasa Grafir Laser Tag Hewan".

### B. RFID Reader (Pembaca)
**Yang harus dibeli:** *Animal RFID Stick Reader* atau *Handheld RFID Scanner*.
- **Konektivitas:** Harus mendukung **Bluetooth HID (Keyboard Emulator)**.
- **Kata Kunci Pencarian:** "Bluetooth Animal RFID Reader", "Stick Reader FDX-B Bluetooth".

## 4. Langkah Implementasi (Tahapan Code)

1. **Database Migration:**
   ```prisma
   // prisma/schema.prisma
   model Hewan {
     id         String   @id @default(cuid())
     tag        String   @unique // E.g. KST-10023
     rfidUid    String?  @unique // UID bawaan chip RFID
     ...
   }
   ```
2. **Pendaftaran Tag Hibrida:**
   - Di halaman `/hewan/[id]`, sistem KostaHub menggunakan `qrcode.react` untuk merender QR Code dari URL: `https://kostahub.com/hewan/[id]`.
   - Admin menyimpan gambar QR Code tersebut dan mencetaknya ke atas tag RFID.
   - Admin menghubungkan scanner RFID, masuk ke halaman edit kambing, fokus ke kolom "UID RFID", dan menembakkan scanner ke tag tersebut untuk mendaftarkan UID-nya ke database.
3. **Penggunaan Sehari-hari:**
   - **Metode A (Kamera HP):** Pekerja memindai QR Code di telinga/leher kambing dengan kamera HP. Browser HP terbuka dan langsung memuat profil kambing tersebut. Pekerja bisa langsung mencatat rekam medis.
   - **Metode B (RFID Reader):** Pekerja membuka dashboard KostaHub di tablet, fokus ke *Search Bar*, lalu menembakkan reader RFID. Angka UID tertulis otomatis, pencarian ter-trigger, dan profil kambing langsung muncul di layar.

## 5. Ringkasan Keunggulan
Implementasi ganda (RFID + QR Code) ini memastikan **redundansi**. Jika chip RFID rusak atau pekerja tidak membawa alat *scanner* khusus, QR Code yang tercetak secara fisik masih selalu bisa diandalkan menggunakan kamera HP apapun. Ini adalah desain IoT yang sangat kokoh (robust) dan mengakomodir berbagai tingkat kemampuan teknologi para peternak di lapangan.
