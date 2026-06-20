'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface LocationPickerProps {
  /** Fired when user manually clicks on the map */
  onLocationSelect: (lat: number, lng: number) => void
  defaultLat?: number
  defaultLng?: number
  /**
   * When set, programmatically pans the map and moves the marker.
   * Used when an address is selected from AddressAutocomplete.
   */
  externalPosition?: { lat: number; lng: number } | null
}

/**
 * Programmatically pan + zoom the map when externalPosition changes.
 * Must be rendered inside <MapContainer>.
 */
function MapController({ position }: { position: { lat: number; lng: number } | null | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 16, { animate: true })
    }
  }, [position, map])
  return null
}

/**
 * Handles map click events and renders the marker.
 * onSelect is called ONLY on user click (not on external position updates).
 */
function LocationMarker({
  position,
  onSelect,
}: {
  position: L.LatLng | null
  onSelect: (latlng: L.LatLng) => void
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng)
    },
  })
  return position ? <Marker position={position} icon={icon} /> : null
}

export default function LocationPicker({
  onLocationSelect,
  defaultLat = -6.2,
  defaultLng = 106.816666,
  externalPosition,
}: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    L.latLng(defaultLat, defaultLng)
  )

  // Sync marker when address autocomplete selects a location
  useEffect(() => {
    if (externalPosition) {
      setPosition(L.latLng(externalPosition.lat, externalPosition.lng))
    }
  }, [externalPosition])

  /** User clicked the map — move marker + notify parent for reverse geocoding */
  function handleMapClick(latlng: L.LatLng) {
    setPosition(latlng)
    onLocationSelect(latlng.lat, latlng.lng)
  }

  return (
    <div
      style={{
        height: 250,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(13,20,15,0.12)',
      }}
    >
      <MapContainer
        center={[defaultLat, defaultLng]}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Pans map when address is selected from autocomplete */}
        <MapController position={externalPosition} />
        {/* Handles user clicks + renders marker */}
        <LocationMarker position={position} onSelect={handleMapClick} />
      </MapContainer>
    </div>
  )
}
