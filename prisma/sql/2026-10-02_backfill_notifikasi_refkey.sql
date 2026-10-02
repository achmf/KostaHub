-- Isi kolom "refKey" untuk notifikasi lama dari penanda "[ref:...]" di message,
-- supaya generator baru tidak membuat ulang (dan mem-push ulang) notifikasi yang sudah ada.
-- Jalankan SEKALI setelah `npx prisma db push` menambahkan kolom refKey:
--   npx prisma db execute --file prisma/sql/2026-10-02_backfill_notifikasi_refkey.sql --schema prisma/schema.prisma
-- Aman diulang: baris yang sudah punya refKey dilewati, dan tidak pernah melanggar @@unique([farmId, refKey]).

WITH kandidat AS (
  SELECT id, "farmId", "createdAt",
         CASE
           -- format lama BERAT-<uuid>-<tanggal> → format baru BERAT-<uuid>-<YYYY-MM>
           WHEN ref LIKE 'BERAT-%'
             THEN 'BERAT-' || substring(ref from '^BERAT-([0-9a-fA-F-]{36})') || '-' || to_char("createdAt", 'YYYY-MM')
           ELSE ref
         END AS kunci
  FROM (
    SELECT id, "farmId", "createdAt", substring(message from '\[ref:([^\]]+)\]') AS ref
    FROM "Notifikasi"
    WHERE "refKey" IS NULL AND "farmId" IS NOT NULL
  ) t
  WHERE ref IS NOT NULL
),
satu_per_kunci AS (
  -- duplikat lama (akibat polling bersamaan) → hanya yang terbaru diberi kunci
  SELECT DISTINCT ON ("farmId", kunci) id, "farmId", kunci
  FROM kandidat
  WHERE kunci IS NOT NULL
  ORDER BY "farmId", kunci, "createdAt" DESC
)
UPDATE "Notifikasi" n
SET "refKey" = s.kunci
FROM satu_per_kunci s
WHERE n.id = s.id
  AND NOT EXISTS (
    SELECT 1 FROM "Notifikasi" x WHERE x."farmId" = s."farmId" AND x."refKey" = s.kunci
  );
