import { updateTag } from 'next/cache'
import { CACHE_TAGS } from './cached-queries'

/**
 * Invalidate cache tags after data mutations.
 * Call this from server actions after successful writes.
 *
 * Uses Next.js 16's `updateTag()` which supports read-your-own-writes
 * semantics in server actions (single argument, no profile needed).
 */
export function invalidateDashboard() {
  updateTag(CACHE_TAGS.dashboard)
}

export function invalidateAdmin() {
  updateTag(CACHE_TAGS.admin)
}

export function invalidateHewan() {
  updateTag(CACHE_TAGS.hewan)
  updateTag(CACHE_TAGS.dashboard)
  updateTag(CACHE_TAGS.admin)
}

export function invalidateMedis() {
  updateTag(CACHE_TAGS.medis)
  updateTag(CACHE_TAGS.dashboard)
}

export function invalidateReproduksi() {
  updateTag(CACHE_TAGS.reproduksi)
  updateTag(CACHE_TAGS.dashboard)
}

export function invalidateBerat() {
  updateTag(CACHE_TAGS.berat)
  updateTag(CACHE_TAGS.dashboard)
}

export function invalidateFarm() {
  updateTag(CACHE_TAGS.farm)
  updateTag(CACHE_TAGS.dashboard)
  updateTag(CACHE_TAGS.admin)
}

export function invalidateStaff() {
  updateTag(CACHE_TAGS.staff)
}

export function invalidateNotifikasi() {
  updateTag(CACHE_TAGS.notifikasi)
  updateTag(CACHE_TAGS.dashboard)
}

/** Invalidate ALL caches — use sparingly */
export function invalidateAll() {
  Object.values(CACHE_TAGS).forEach(tag => updateTag(tag))
}
