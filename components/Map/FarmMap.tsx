'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Farm, MapLayer } from './MapPageClient'
import { saveGeojson } from '@/actions/saveGeojson'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy GIS layers
const DrawPolygonControl = dynamic(() => import('./DrawPolygonControl'), { ssr: false })
const HeatmapLayer = dynamic(() => import('./HeatmapLayer'), { ssr: false })
const RadiusAnalysisLayer = dynamic(() => import('./RadiusAnalysis'), { ssr: false })

// Fix leaflet default icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const TILE_LAYERS: Record<MapLayer, { url: string; attribution: string }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
}

const FARM_COLORS = ['#3F5B3A', '#C7873E', '#5B3A3A', '#3A5B58', '#5B4A3A', '#3A4A5B']

function createFarmIcon(farm: Farm, isSelected: boolean) {
  const isActive = farm.status === 'AKTIF'
  const bgColor = isSelected ? '#1B2A1F' : isActive ? '#3F5B3A' : 'rgba(13,20,15,0.35)'
  const count = farm._count.hewan

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 68" width="52" height="68">
      <ellipse cx="26" cy="65" rx="12" ry="4" fill="rgba(0,0,0,0.18)"/>
      <path d="M26 2C14.4 2 5 11.4 5 23c0 17.3 21 43 21 43S47 40.3 47 23C47 11.4 37.6 2 26 2z"
        fill="${bgColor}" stroke="white" stroke-width="2.5"/>
      <circle cx="26" cy="23" r="15" fill="rgba(255,255,255,0.95)"/>
      <text x="26" y="20" text-anchor="middle" font-size="10" font-weight="700"
        fill="${bgColor}" font-family="'JetBrains Mono',monospace">${count}</text>
      <text x="26" y="30" text-anchor="middle" font-size="7"
        fill="${bgColor}" font-family="'Inter',sans-serif" opacity="0.7">hewan</text>
      ${isSelected ? '<circle cx="26" cy="23" r="17" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>' : ''}
    </svg>
  `

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [52, 68],
    iconAnchor: [26, 68],
    popupAnchor: [0, -70],
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount()
  const size = count > 50 ? 56 : count > 20 ? 48 : 40

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:#1B2A1F;border:3px solid #C7873E;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 16px rgba(0,0,0,0.3);
        font-family:'Fraunces',serif;font-size:${count > 99 ? 12 : 15}px;
        color:#F2EDE0;font-weight:600;
      ">${count}</div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── FocusMap ─────────────────────────────────────────────────────────────────
function FocusMap({ farm }: { farm: Farm | null }) {
  const map = useMap()
  useEffect(() => {
    if (farm?.lat && farm?.lng) {
      map.flyTo([farm.lat, farm.lng], 15, { duration: 1.2 })
    }
  }, [farm, map])
  return null
}

// ─── InitBounds ───────────────────────────────────────────────────────────────
function InitBounds({ farms }: { farms: Farm[] }) {
  const map = useMap()
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const valid = farms.filter((f): f is Farm & { lat: number; lng: number } => !!f.lat && !!f.lng)
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 14)
    } else if (valid.length > 1) {
      const bounds = L.latLngBounds(valid.map(f => [f.lat, f.lng]))
      map.fitBounds(bounds, { padding: [60, 60] })
    }
  }, [farms, map])
  return null
}

// ─── LayerController ──────────────────────────────────────────────────────────
function LayerController({ layer }: { layer: MapLayer }) {
  const map = useMap()
  useEffect(() => {
    map.eachLayer(l => {
      if ((l as L.TileLayer).options?.attribution !== undefined && l instanceof L.TileLayer) {
        map.removeLayer(l)
      }
    })
    const tile = TILE_LAYERS[layer]
    L.tileLayer(tile.url, { attribution: tile.attribution, maxZoom: 19 }).addTo(map)
  }, [layer, map])
  return null
}

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

// ─── Popup HTML ───────────────────────────────────────────────────────────────
function buildPopupHtml(farm: Farm) {
  const isActive = farm.status === 'AKTIF'
  return `
    <div style="font-family:'Inter',sans-serif; min-width:220px; padding:4px 0;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${isActive ? '#4ade80' : '#9ca3af'};flex-shrink:0;"></div>
        <strong style="font-size:14px;color:#0D140F;">${farm.nama}</strong>
        <span style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:0.1em;color:${isActive ? '#3F5B3A' : '#9ca3af'};padding:2px 8px;border-radius:99px;border:1px solid ${isActive ? 'rgba(63,91,58,0.3)' : 'rgba(13,20,15,0.15)'}">
          ${farm.status}
        </span>
      </div>
      ${farm.alamat ? `<div style="font-size:11px;color:rgba(13,20,15,0.55);margin-bottom:10px;line-height:1.5;">${farm.alamat}</div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
        ${[['TOTAL', farm._count.hewan], ['AKTIF', farm.hewanAktif], ['INDUKAN', farm.hewanIndukan], ['PEJANTAN', farm.hewanPejantan]]
          .map(([label, val]) => `
            <div style="text-align:center;padding:6px;border-radius:8px;background:rgba(13,20,15,0.04);border:1px solid rgba(13,20,15,0.08);">
              <div style="font-family:'Fraunces',serif;font-size:18px;color:#1B2A1F;">${val}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:0.12em;color:rgba(13,20,15,0.4);">${label}</div>
            </div>
          `).join('')}
      </div>
      ${farm.deskripsi ? `<p style="font-size:11px;color:rgba(13,20,15,0.55);margin-bottom:10px;line-height:1.5;">${farm.deskripsi}</p>` : ''}
      <a href="/farm/${farm.id}" style="display:block;text-align:center;padding:8px 12px;background:#1B2A1F;color:#F2EDE0;border-radius:99px;font-size:12px;font-weight:500;text-decoration:none;">
        Lihat Detail Farm →
      </a>
      ${farm.lat ? `
        <a href="https://www.google.com/maps?q=${farm.lat},${farm.lng}" target="_blank"
          style="display:block;text-align:center;padding:6px;margin-top:6px;border:1px solid rgba(13,20,15,0.12);border-radius:99px;font-size:11px;color:rgba(13,20,15,0.55);text-decoration:none;">
          Buka di Google Maps
        </a>
      ` : ''}
    </div>
  `
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export interface FarmMapProps {
  farms: Farm[]
  selectedFarm: Farm | null
  onSelectFarm: (farm: Farm | null) => void
  layer: MapLayer
  role: string
  showHeatmap: boolean
  showRadius: boolean
  drawMode: boolean
  onDrawClose: () => void
  onDrawSaved: (farmId: string, geojson: string | null) => void
  radiusKm: number
  radiusCenter: { lat: number; lng: number }
  onRadiusCenterChange: (lat: number, lng: number) => void
  onFarmsInRadius: (farms: Farm[]) => void
}

export default function FarmMap({
  farms,
  selectedFarm,
  onSelectFarm,
  layer,
  role,
  showHeatmap,
  showRadius,
  drawMode,
  onDrawClose,
  onDrawSaved,
  radiusKm,
  radiusCenter,
  onRadiusCenterChange,
  onFarmsInRadius,
}: FarmMapProps) {
  const defaultCenter: [number, number] = [-6.9175, 107.6191]
  const validFarms = farms.filter((f): f is Farm & { lat: number; lng: number } => !!f.lat && !!f.lng)
  const initialCenter = validFarms.length > 0 ? [validFarms[0].lat, validFarms[0].lng] as [number, number] : defaultCenter

  const [isSavingPolygon, setIsSavingPolygon] = useState(false)

  async function handlePolygonSave(geojson: string | null) {
    if (!selectedFarm) return
    setIsSavingPolygon(true)
    const result = await saveGeojson(selectedFarm.id, geojson)
    setIsSavingPolygon(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(geojson ? 'Area kandang berhasil disimpan!' : 'Area kandang dihapus.')
      onDrawSaved(selectedFarm.id, geojson)
      onDrawClose()
    }
  }

  return (
    <MapContainer
      center={initialCenter}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution={TILE_LAYERS.street.attribution}
        url={TILE_LAYERS.street.url}
      />

      <InitBounds farms={validFarms} />
      <FocusMap farm={selectedFarm} />
      <LayerController layer={layer} />
      <MapResizer />

      {/* Heatmap overlay */}
      {showHeatmap && <HeatmapLayer farms={farms} />}

      {/* Radius analysis overlay */}
      {showRadius && (
        <RadiusAnalysisLayer
          farms={farms}
          radiusKm={radiusKm}
          centerLat={radiusCenter.lat}
          centerLng={radiusCenter.lng}
          onCenterChange={onRadiusCenterChange}
          onFarmsInRadius={onFarmsInRadius}
        />
      )}

      {/* Draw polygon control — OWNER only */}
      {drawMode && selectedFarm && role === 'OWNER' && (
        <DrawPolygonControl
          farm={selectedFarm}
          onSave={handlePolygonSave}
          onClose={onDrawClose}
        />
      )}

      {/* Saving overlay */}
      {isSavingPolygon && (
        <div className="absolute inset-0 z-[3000] flex items-center justify-center"
          style={{ background: 'rgba(13,20,15,0.4)', backdropFilter: 'blur(2px)' }}>
          <div className="px-6 py-4 rounded-2xl text-center"
            style={{ background: '#1B2A1F', color: '#F2EDE0', fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-2"
              style={{ borderColor: '#C7873E transparent #C7873E #C7873E' }} />
            Menyimpan area kandang…
          </div>
        </div>
      )}

      {/* Clustered farm markers */}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterIcon}
        showCoverageOnHover={false}
        maxClusterRadius={60}
        disableClusteringAtZoom={14}
      >
        {farms.map(farm => {
          if (!farm.lat || !farm.lng) return null
          const isSelected = selectedFarm?.id === farm.id
          return (
            <Marker
              key={farm.id}
              position={[farm.lat, farm.lng]}
              icon={createFarmIcon(farm, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onSelectFarm(isSelected ? null : farm),
              }}
            >
              <Popup className="farm-popup-custom" minWidth={240}>
                <div dangerouslySetInnerHTML={{ __html: buildPopupHtml(farm) }} />
              </Popup>
            </Marker>
          )
        })}
      </MarkerClusterGroup>

      {/* GeoJSON polygon overlays */}
      {farms.map((farm, idx) => {
        if (!farm.geojson) return null
        try {
          const geoData = JSON.parse(farm.geojson)
          const color = FARM_COLORS[idx % FARM_COLORS.length]
          return (
            <GeoJSON
              key={`geo-${farm.id}-${farm.geojson.length}`}
              data={geoData}
              style={{
                color,
                weight: selectedFarm?.id === farm.id ? 3 : 2,
                fillColor: color,
                fillOpacity: selectedFarm?.id === farm.id ? 0.25 : 0.12,
                dashArray: selectedFarm?.id === farm.id ? undefined : '6, 4',
              }}
            />
          )
        } catch {
          return null
        }
      })}
    </MapContainer>
  )
}
