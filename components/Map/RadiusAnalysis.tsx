'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Farm } from './MapPageClient'

// Haversine: distance between two lat/lng points in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface Props {
  farms: Farm[]
  radiusKm: number
  centerLat: number
  centerLng: number
  onCenterChange: (lat: number, lng: number) => void
  onFarmsInRadius: (farms: Farm[]) => void
}

export default function RadiusAnalysisLayer({
  farms,
  radiusKm,
  centerLat,
  centerLng,
  onCenterChange,
  onFarmsInRadius,
}: Props) {
  const map = useMap()
  const circleRef = useRef<L.Circle | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const highlightRefs = useRef<L.Circle[]>([])

  // Recompute farms in radius whenever center or radius changes
  useEffect(() => {
    const inRadius = farms.filter(
      f => f.lat && f.lng && haversineKm(centerLat, centerLng, f.lat, f.lng) <= radiusKm
    )
    onFarmsInRadius(inRadius)
  }, [centerLat, centerLng, radiusKm, farms, onFarmsInRadius])

  // Draw circle + draggable center marker
  useEffect(() => {
    // Remove old layers
    circleRef.current?.remove()
    markerRef.current?.remove()
    highlightRefs.current.forEach(c => c.remove())
    highlightRefs.current = []

    // Draw radius circle
    const circle = L.circle([centerLat, centerLng], {
      radius: radiusKm * 1000,
      color: '#C7873E',
      fillColor: '#C7873E',
      fillOpacity: 0.06,
      weight: 2,
      dashArray: '8, 6',
    }).addTo(map)
    circleRef.current = circle

    // Draggable center marker
    const centerIcon = L.divIcon({
      html: `<div style="
        width:24px;height:24px;border-radius:50%;
        background:#C7873E;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        cursor:grab;
      "></div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const marker = L.marker([centerLat, centerLng], {
      icon: centerIcon,
      draggable: true,
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      onCenterChange(pos.lat, pos.lng)
    })
    markerRef.current = marker

    // Highlight farms in radius with small ring
    farms.forEach(f => {
      if (!f.lat || !f.lng) return
      const dist = haversineKm(centerLat, centerLng, f.lat, f.lng)
      const inRadius = dist <= radiusKm
      const highlight = L.circle([f.lat, f.lng], {
        radius: 300,
        color: inRadius ? '#3F5B3A' : 'rgba(13,20,15,0.2)',
        fillColor: inRadius ? '#3F5B3A' : 'transparent',
        fillOpacity: inRadius ? 0.2 : 0,
        weight: inRadius ? 2.5 : 1,
      }).addTo(map)
      highlightRefs.current.push(highlight)
    })

    return () => {
      circleRef.current?.remove()
      markerRef.current?.remove()
      highlightRefs.current.forEach(c => c.remove())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLng, radiusKm, map])

  return null
}
