'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import dynamic from 'next/dynamic'
import type { AdminFarm, MapLayer } from './AdminMapClient'
import type { Farm } from '@/components/Map/MapPageClient'
import { saveGeojsonAdmin } from '@/actions/admin/saveGeojsonAdmin'
import { toast } from 'sonner'

// Dynamically load GIS sub-components (no SSR)
const HeatmapLayer = dynamic(() => import('@/components/Map/HeatmapLayer'), { ssr: false })
const RadiusAnalysisLayer = dynamic(() => import('@/components/Map/RadiusAnalysis'), { ssr: false })
const DrawPolygonControl = dynamic(() => import('@/components/Map/DrawPolygonControl'), { ssr: false })

// Fix Leaflet default icon paths
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

const POLY_COLORS = ['#3F5B3A', '#C7873E', '#5B3A3A', '#3A5B58', '#5B4A3A', '#3A4A5B']

// AdminFarm is a superset of Farm — cast is safe
function toFarm(f: AdminFarm): Farm {
  return f as unknown as Farm
}

function createAdminMarkerIcon(farm: AdminFarm, isSelected: boolean) {
  const isActive = farm.status === 'AKTIF'
  const initial = (farm.ownerName ?? '?').charAt(0).toUpperCase()
  const bgColor = isSelected ? '#1B2A1F' : isActive ? '#3F5B3A' : 'rgba(13,20,15,0.4)'

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 72" width="56" height="72">
      <ellipse cx="28" cy="69" rx="13" ry="4" fill="rgba(0,0,0,0.15)"/>
      <path d="M28 2C15.8 2 6 11.8 6 24c0 18.2 22 46 22 46S50 42.2 50 24C50 11.8 40.2 2 28 2z"
        fill="${bgColor}" stroke="white" stroke-width="2.5"/>
      <circle cx="28" cy="24" r="16" fill="rgba(255,255,255,0.95)"/>
      <text x="28" y="20" text-anchor="middle" font-size="10" font-weight="700"
        fill="${bgColor}" font-family="'JetBrains Mono',monospace">${farm._count.hewan}</text>
      <text x="28" y="30" text-anchor="middle" font-size="7.5"
        fill="${bgColor}" font-family="'Inter',sans-serif" opacity="0.65">${initial}</text>
      ${isSelected ? '<circle cx="28" cy="24" r="18" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>' : ''}
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [56, 72],
    iconAnchor: [28, 72],
    popupAnchor: [0, -74],
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

function FocusMap({ farm }: { farm: AdminFarm | null }) {
  const map = useMap()
  useEffect(() => {
    if (farm?.lat && farm?.lng) map.flyTo([farm.lat, farm.lng], 15, { duration: 1.2 })
  }, [farm, map])
  return null
}

function InitBounds({ farms }: { farms: AdminFarm[] }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    const valid = farms.filter((f): f is AdminFarm & { lat: number; lng: number } => !!f.lat && !!f.lng)
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 13)
    } else if (valid.length > 1) {
      map.fitBounds(L.latLngBounds(valid.map((f) => [f.lat, f.lng])), { padding: [60, 60] })
    }
  }, [farms, map])
  return null
}

function LayerController({ layer }: { layer: MapLayer }) {
  const map = useMap()
  useEffect(() => {
    map.eachLayer((l) => {
      if (l instanceof L.TileLayer) map.removeLayer(l)
    })
    const t = TILE_LAYERS[layer]
    L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map)
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

function buildPopupHtml(farm: AdminFarm) {
  const isActive = farm.status === 'AKTIF'
  const rows = [
    ['TOTAL', farm._count.hewan],
    ['AKTIF', farm.hewanAktif],
    ['INDUKAN', farm.hewanIndukan],
    ['PEJANTAN', farm.hewanPejantan],
  ] as const

  return `
    <div style="font-family:'Inter',sans-serif;min-width:230px;padding:4px 0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${isActive ? '#4ade80' : '#9ca3af'};flex-shrink:0;"></div>
        <strong style="font-size:13px;color:#0D140F;">${farm.nama}</strong>
        <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:${isActive ? '#3F5B3A' : '#9ca3af'};padding:2px 7px;border-radius:99px;border:1px solid ${isActive ? 'rgba(63,91,58,0.3)' : 'rgba(13,20,15,0.15)'}">
          ${farm.status}
        </span>
      </div>
      <div style="font-size:11px;color:rgba(13,20,15,0.5);margin-bottom:8px;">
        Owner: <strong style="color:#1B2A1F;">${farm.ownerName}</strong>
      </div>
      ${farm.alamat ? `<div style="font-size:11px;color:rgba(13,20,15,0.55);margin-bottom:8px;line-height:1.5;">${farm.alamat}</div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
        ${rows.map(([label, val]) => `
          <div style="text-align:center;padding:5px;border-radius:8px;background:rgba(13,20,15,0.04);border:1px solid rgba(13,20,15,0.08);">
            <div style="font-family:'Fraunces',serif;font-size:17px;color:#1B2A1F;">${val}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:0.12em;color:rgba(13,20,15,0.4);">${label}</div>
          </div>
        `).join('')}
      </div>
      <a href="/admin/farms/${farm.id}" style="display:block;text-align:center;padding:7px 12px;background:#1B2A1F;color:#F2EDE0;border-radius:99px;font-size:12px;font-weight:500;text-decoration:none;">
        Lihat di Admin →
      </a>
    </div>
  `
}

export interface AdminFarmMapProps {
  farms: AdminFarm[]
  selectedFarm: AdminFarm | null
  onSelectFarm: (farm: AdminFarm | null) => void
  layer: MapLayer
  showHeatmap: boolean
  showRadius: boolean
  drawMode: boolean
  onDrawClose: () => void
  onDrawSaved: (farmId: string, geojson: string | null) => void
  radiusKm: number
  radiusCenter: { lat: number; lng: number }
  onRadiusCenterChange: (lat: number, lng: number) => void
  onFarmsInRadius: (farms: AdminFarm[]) => void
}

export default function AdminFarmMap({
  farms,
  selectedFarm,
  onSelectFarm,
  layer,
  showHeatmap,
  showRadius,
  drawMode,
  onDrawClose,
  onDrawSaved,
  radiusKm,
  radiusCenter,
  onRadiusCenterChange,
  onFarmsInRadius,
}: AdminFarmMapProps) {
  const defaultCenter: [number, number] = [-6.9175, 107.6191]
  const validFarms = farms.filter(
    (f): f is AdminFarm & { lat: number; lng: number } => !!f.lat && !!f.lng
  )
  const initialCenter: [number, number] =
    validFarms.length > 0 ? [validFarms[0].lat, validFarms[0].lng] : defaultCenter

  const [isSaving, setIsSaving] = useState(false)

  // Memoize farm arrays so downstream GIS layers don't get new refs every render
  const farmsAsFarm = useMemo(() => farms.map(toFarm), [farms])

  // CRITICAL: useCallback prevents infinite loop with RadiusAnalysis useEffect.
  // Without this, every render creates a new function ref → RadiusAnalysis
  // sees changed dep → re-runs effect → calls setState → re-render → loop.
  const stableOnFarmsInRadius = useCallback(
    (inRadius: Farm[]) => {
      onFarmsInRadius(
        inRadius
          .map((f) => farms.find((af) => af.id === f.id)!)
          .filter(Boolean)
      )
    },
    [farms, onFarmsInRadius]
  )

  async function handlePolygonSave(geojson: string | null) {
    if (!selectedFarm) return
    setIsSaving(true)
    const result = await saveGeojsonAdmin(selectedFarm.id, geojson)
    setIsSaving(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(geojson ? 'Area kandang berhasil disimpan!' : 'Area kandang dihapus.')
      onDrawSaved(selectedFarm.id, geojson)
      onDrawClose()
    }
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={initialCenter}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        zoomControl={false}
      >
        {/* Default tile — LayerController will replace it */}
        <TileLayer
          attribution={TILE_LAYERS.street.attribution}
          url={TILE_LAYERS.street.url}
        />

        <InitBounds farms={validFarms} />
        <FocusMap farm={selectedFarm} />
        <LayerController layer={layer} />
        <MapResizer />

        {/* GIS layers */}
        {showHeatmap && <HeatmapLayer farms={farmsAsFarm} />}

        {showRadius && (
          <RadiusAnalysisLayer
            farms={farmsAsFarm}
            radiusKm={radiusKm}
            centerLat={radiusCenter.lat}
            centerLng={radiusCenter.lng}
            onCenterChange={onRadiusCenterChange}
            onFarmsInRadius={stableOnFarmsInRadius}
          />
        )}

        {drawMode && selectedFarm && (
          <DrawPolygonControl
            farm={toFarm(selectedFarm)}
            onSave={handlePolygonSave}
            onClose={onDrawClose}
          />
        )}

        {/* Cluster + markers */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          showCoverageOnHover={false}
          maxClusterRadius={60}
          disableClusteringAtZoom={14}
        >
          {farms.map((farm) => {
            if (!farm.lat || !farm.lng) return null
            const isSelected = selectedFarm?.id === farm.id
            return (
              <Marker
                key={farm.id}
                position={[farm.lat, farm.lng]}
                icon={createAdminMarkerIcon(farm, isSelected)}
                zIndexOffset={isSelected ? 1000 : 0}
                eventHandlers={{ click: () => onSelectFarm(isSelected ? null : farm) }}
              >
                <Popup minWidth={240}>
                  <div dangerouslySetInnerHTML={{ __html: buildPopupHtml(farm) }} />
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>

        {/* GeoJSON polygons */}
        {farms.map((farm, idx) => {
          if (!farm.geojson) return null
          try {
            const geoData = JSON.parse(farm.geojson)
            const color = POLY_COLORS[idx % POLY_COLORS.length]
            return (
              <GeoJSON
                key={`geo-${farm.id}-${farm.geojson.length}`}
                data={geoData}
                style={{
                  color,
                  weight: selectedFarm?.id === farm.id ? 3 : 2,
                  fillColor: color,
                  fillOpacity: selectedFarm?.id === farm.id ? 0.25 : 0.10,
                  dashArray: selectedFarm?.id === farm.id ? undefined : '6, 4',
                }}
              />
            )
          } catch {
            return null
          }
        })}
      </MapContainer>

      {/* Saving overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-[3000] flex items-center justify-center"
          style={{ background: 'rgba(13,20,15,0.4)', backdropFilter: 'blur(2px)' }}>
          <div className="px-6 py-4 rounded-2xl text-center"
            style={{ background: '#1B2A1F', color: '#F2EDE0', fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            <div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto mb-2"
              style={{ borderColor: '#C7873E transparent #C7873E #C7873E' }} />
            Menyimpan area kandang…
          </div>
        </div>
      )}
    </div>
  )
}
