/**
 * Reverse geocode lat/lng to a human-readable address using Nominatim (OpenStreetMap).
 * Client-side only — call from 'use client' components.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'id' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data.display_name as string) ?? null
  } catch {
    return null
  }
}
