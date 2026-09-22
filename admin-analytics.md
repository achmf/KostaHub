# Admin Analytics Optimization Plan

**Project Type**: WEB
**Tech Stack**: Next.js (App Router), Prisma, PostgreSQL

## Overview
The current Admin Analytics page (`/admin/analytics/page.tsx`) suffers from the N+1 query problem, making 7 queries per farm for animal statistics and 3 queries per farm for reproduction statistics. With hundreds or thousands of farms, this will result in tens of thousands of database queries, causing severe performance degradation and potential timeouts.

This plan addresses the performance bottlenecks by replacing N+1 and full-table data fetches with efficient, grouped database queries (using `prisma.groupBy` and `prisma.$queryRaw`), ensuring the page loads quickly regardless of the number of farms.

## User Review Required
> [!IMPORTANT]
> The optimization involves using `prisma.$queryRaw` for joining `Reproduksi` with `Hewan` since Prisma's `groupBy` doesn't natively support grouping by relations. Please verify if using raw queries is acceptable in this project.

## Proposed Changes

### Database Query Optimization (`app/admin/analytics/page.tsx`)

#### [MODIFY] page.tsx
- **Hewan Per Farm**: Replace `Promise.all` `.count` queries with a single `prisma.hewan.groupBy({ by: ['farmId', 'kategori', 'status'], _count: true })`.
- **Reproduksi Per Farm**: Replace `Promise.all` `.count` queries with a `prisma.$queryRaw` to group `Reproduksi` status by `induk.farmId`.
- **Distribusi Umur**: Optimize `allHewanAktif` fetch. Depending on scale, we can either use a raw query or keep the fetch if memory footprint is acceptable, but raw query with date bins is more robust for scale.
- **Top Diagnosa & Kategori Medis**: Replace in-memory mapping with `prisma.rekamMedis.groupBy` to offload grouping and counting to the database.

## Task Breakdown

- `[ ]` **Task 1: Optimize Hewan Grouping**
  - **Agent**: `backend-specialist`
  - **Input**: Current `hewanPerFarm` loop logic.
  - **Output**: Single `groupBy` query parsed into the expected array structure.
  - **Verify**: The UI receives identical structured data.
- `[ ]` **Task 2: Optimize Reproduksi Grouping**
  - **Agent**: `backend-specialist`
  - **Input**: Current `reproduksiPerFarm` loop logic.
  - **Output**: Single `$queryRaw` query parsed into the expected array structure.
  - **Verify**: Correct mapping of `farmId` to reproduction statistics.
- `[ ]` **Task 3: Optimize Top Diagnosa & Medis**
  - **Agent**: `backend-specialist`
  - **Input**: Current `rekamMedis` 1000 take query.
  - **Output**: `groupBy` queries for `diagnosis` and `kategori` mapping directly to UI requirements.
  - **Verify**: The top 8 diagnoses and categories are accurately calculated by the DB.

## Verification Plan

### Automated Tests
- Run Prisma type checks.
- Run `npm run lint` and `npx tsc --noEmit`.

### Manual Verification
- Access the `http://localhost:3003/admin/analytics` page.
- Verify page load time is reduced.
- Verify that the charts and metrics exactly match the expected data format.
