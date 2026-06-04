'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { MapPin, Egg, Activity } from 'lucide-react'

// Fix leaflet default icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createFarmIcon(status: string) {
  const color = status === 'AKTIF' ? '#10b981' : '#9ca3af'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="40" height="52">
      <path d="M20 0C9 0 0 9 0 20c0 15 20 32 20 32S40 35 40 20C40 9 31 0 20 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="20" cy="20" r="10" fill="white" opacity="0.9"/>
      <text x="20" y="25" text-anchor="middle" font-size="13" font-weight="bold" fill="${color}">F</text>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
  })
}

function MapBounds({ farms }: { farms: Farm[] }) {
  const map = useMap()
  useEffect(() => {
    const validFarms = farms.filter((f): f is Farm & { lat: number, lng: number } => f.lat !== null && f.lng !== null)
    if (validFarms.length === 1) {
      map.setView([validFarms[0].lat, validFarms[0].lng], 14)
    } else if (validFarms.length > 1) {
      const bounds = L.latLngBounds(validFarms.map(f => [f.lat, f.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [farms, map])
  return null
}

interface Farm {
  id: string
  nama: string
  alamat: string | null
  lat: number | null
  lng: number | null
  geojson: string | null
  deskripsi: string | null
  status: string
  _count: { hewan: number }
}

export default function FarmMap({ farms }: { farms: Farm[] }) {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const defaultCenter: [number, number] = [-6.9175, 107.6191]

  const validFarms = farms.filter((f): f is Farm & { lat: number, lng: number } => f.lat !== null && f.lng !== null)
  const mapCenter = validFarms.length > 0 
    ? [validFarms[0].lat!, validFarms[0].lng!] as [number, number]
    : defaultCenter

  return (
    <div className="space-y-4">
      {/* Farm Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {farms.map((farm) => (
          <motion.button
            key={farm.id}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedFarm(farm.id === selectedFarm?.id ? null : farm)}
            className={`cursor-pointer p-4 rounded-xl border text-left transition-all duration-200 ${
              selectedFarm?.id === farm.id 
                ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100' 
                : 'border-gray-200 bg-white hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${farm.status === 'AKTIF' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="font-bold text-gray-900 text-sm truncate">{farm.nama}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Egg size={11} />
              <span>{farm._count.hewan} hewan</span>
            </div>
            {farm.lat && <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin size={10} />{farm.lat.toFixed(4)}, {farm.lng?.toFixed(4)}</div>}
          </motion.button>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200" style={{ height: '550px' }}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBounds farms={validFarms} />
          
          {farms.map(farm => {
            if (!farm.lat || !farm.lng) return null
            return (
              <Marker
                key={farm.id}
                position={[farm.lat, farm.lng]}
                icon={createFarmIcon(farm.status)}
                eventHandlers={{ click: () => setSelectedFarm(farm) }}
              >
                <Popup className="farm-popup">
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-gray-900 text-base mb-1">{farm.nama}</h3>
                    {farm.alamat && <p className="text-xs text-gray-500 mb-2">{farm.alamat}</p>}
                    <div className="flex gap-3 text-sm">
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <Egg size={13} /> {farm._count.hewan} Hewan
                      </span>
                      <span className={`font-semibold ${farm.status === 'AKTIF' ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {farm.status}
                      </span>
                    </div>
                    {farm.deskripsi && <p className="text-xs text-gray-500 mt-2">{farm.deskripsi}</p>}
                    <a
                      href={`/farm/${farm.id}`}
                      className="block mt-3 text-center py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      Detail Farm →
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Render GeoJSON kandang polygons */}
          {farms.map(farm => {
            if (!farm.geojson) return null
            try {
              const geoData = JSON.parse(farm.geojson)
              return (
                <GeoJSON
                  key={`geo-${farm.id}`}
                  data={geoData}
                  style={{
                    color: '#10b981',
                    weight: 2,
                    fillColor: '#10b981',
                    fillOpacity: 0.15,
                    dashArray: '5, 5',
                  }}
                />
              )
            } catch {
              return null
            }
          })}
        </MapContainer>
      </div>

      {/* No location farms info */}
      {farms.filter(f => !f.lat).length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <Activity size={16} className="shrink-0" />
          <span>{farms.filter(f => !f.lat).length} farm belum memiliki koordinat GPS. Set koordinat di menu &quot;Kelola Farm&quot;.</span>
        </div>
      )}
    </div>
  )
}
