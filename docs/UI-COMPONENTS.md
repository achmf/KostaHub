# SiKambing UI Components

Daftar reusable component yang tersedia di `components/ui/` dan di-export melalui barrel file `index.ts`. Selalu gunakan komponen dari list ini untuk menjaga konsistensi UI/UX di seluruh sistem SiKambing.

## Daftar Komponen

| Komponen | Kegunaan & Props Utama |
| :--- | :--- |
| **`Button`** & **`LinkButton`** | Tombol aksi (`Button`) dan tautan (`LinkButton`). Gunakan prop `variant`: `success` (hijau), `error` (merah), `warning` (kuning), `outline`, `ghost`. Prop `size`: `sm`, `md`, `lg`, `icon`. |
| **`PageHeader`** | Header halaman. Menerima `title`, `description`, dan `action` (slot ReactNode untuk tombol di pojok kanan atas). |
| **`DataTable`** | Tabel standar untuk listing data. Menerima props `columns`, `data`, `keyField`, dan `emptyState` (komponen `EmptyState`). |
| **`Badge`** | Label penanda status/kategori. Prop `variant` bisa di-map dengan fungsi bawaan `STATUS_BADGE_VARIANT` atau `KATEGORI_BADGE_VARIANT`. Prop `shape`: `pill` atau `rounded`. |
| **`Alert`** | Kotak peringatan/notifikasi (sering dipakai di form error). Menerima prop `variant`: `success`, `error`, `warning`, `info`. |
| **`EmptyState`** | Penanda data kosong (biasanya di-inject ke `DataTable`). Menerima `title`, `description`, dan boolean `useGoatIcon`. |
| **`Modal`** | Overlay dialog/pop-up. Dipakai untuk konfirmasi aksi destruktif (hapus) atau formulir pop-up. |
| **`FormField`** | Wrapper grup input. Otomatis menyediakan styling standard untuk form (label, spacing, dll). |
| **`Card`** | Wrapper container block yang membungkus konten dalam kotak dengan shadow dan border standar aplikasi. |
| **`GoatIcon`** | Ikon khusus/SVG kambing Kosta (dipakai di `EmptyState`). |

## Cara Penggunaan (Import)

Semua komponen di atas dapat di-import langsung dari `@/components/ui`:

```tsx
import { Button, PageHeader, DataTable, Badge } from '@/components/ui'
```

> **Catatan Developer:** Jika Anda membuat komponen generik baru di dalam folder `components/ui/`, pastikan untuk selalu mendaftarkannya ke `index.ts` (barrel file) dan **memperbarui daftar di dokumen ini**.
