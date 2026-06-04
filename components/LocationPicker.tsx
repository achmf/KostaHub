'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default icon issue with Leaflet in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  defaultLat?: number
  defaultLng?: number
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
    },
  })

  return position === null ? null : (
    <Marker position={position} icon={icon}></Marker>
  )
}

export default function LocationPicker({ onLocationSelect, defaultLat = -6.200000, defaultLng = 106.816666 }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    defaultLat && defaultLng ? L.latLng(defaultLat, defaultLng) : null
  )

  useEffect(() => {
    if (position) {
      onLocationSelect(position.lat, position.lng)
    }
  }, [position, onLocationSelect])

  return (
    <div style={{ height: 250, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(13,20,15,0.12)' }}>
      <MapContainer center={[defaultLat, defaultLng]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  )
}
