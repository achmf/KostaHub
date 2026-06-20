'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { PenLine, Check, Undo2, CheckCircle2, Save, X, Trash2, RefreshCw } from 'lucide-react'
import type { Farm } from './MapPageClient'

interface Props {
  farm: Farm
  onSave: (geojson: string | null) => void
  onClose: () => void
}

export default function DrawPolygonControl({ farm, onSave, onClose }: Props) {
  const map = useMap()

  // Panel ref — prevent clicks on UI from bubbling to Leaflet map
  const panelRef = useRef<HTMLDivElement>(null)

  // Drawing state — use refs for event handlers (avoid stale closure)
  const isDrawingRef = useRef(false)
  const pointsRef = useRef<L.LatLng[]>([])

  // Layers
  const previewLayerRef = useRef<L.Layer | null>(null)
  const finalPolygonRef = useRef<L.Polygon | null>(null)
  const existingLayerRef = useRef<L.Layer | null>(null)
  const vertexMarkersRef = useRef<L.CircleMarker[]>([])

  // UI state (triggers re-render)
  const [phase, setPhase] = useState<'idle' | 'drawing' | 'done'>('idle')
  const [pointCount, setPointCount] = useState(0)

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function clearPreview() {
    if (previewLayerRef.current) {
      map.removeLayer(previewLayerRef.current)
      previewLayerRef.current = null
    }
    vertexMarkersRef.current.forEach(m => map.removeLayer(m))
    vertexMarkersRef.current = []
  }

  function drawPreview(pts: L.LatLng[]) {
    clearPreview()
    if (pts.length === 0) return

    // Vertex dots
    pts.forEach(pt => {
      const marker = L.circleMarker(pt, {
        radius: 5,
        color: '#fff',
        fillColor: '#C7873E',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map)
      vertexMarkersRef.current.push(marker)
    })

    // Line / polygon preview
    if (pts.length >= 3) {
      previewLayerRef.current = L.polygon(pts, {
        color: '#C7873E',
        fillColor: '#C7873E',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '8, 5',
      }).addTo(map)
    } else if (pts.length === 2) {
      previewLayerRef.current = L.polyline(pts, {
        color: '#C7873E',
        weight: 2,
        dashArray: '8, 5',
      }).addTo(map)
    }
  }

  function drawFinalPolygon(pts: L.LatLng[]) {
    if (finalPolygonRef.current) {
      map.removeLayer(finalPolygonRef.current)
    }
    finalPolygonRef.current = L.polygon(pts, {
      color: '#C7873E',
      fillColor: '#C7873E',
      fillOpacity: 0.25,
      weight: 2.5,
    }).addTo(map)
  }

  // ─── Mount/unmount ──────────────────────────────────────────────────────────

  useEffect(() => {
    // Stop all mouse/touch events on the panel from reaching the Leaflet map
    if (panelRef.current) {
      L.DomEvent.disableClickPropagation(panelRef.current)
      L.DomEvent.disableScrollPropagation(panelRef.current)
    }

    // Load existing GeoJSON polygon
    if (farm.geojson) {
      try {
        existingLayerRef.current = L.geoJSON(JSON.parse(farm.geojson), {
          style: { color: '#C7873E', fillColor: '#C7873E', fillOpacity: 0.2, weight: 2.5 },
        }).addTo(map)
      } catch { /* invalid geojson */ }
    }

    return () => {
      // Full cleanup
      clearPreview()
      if (previewLayerRef.current) map.removeLayer(previewLayerRef.current)
      if (finalPolygonRef.current) map.removeLayer(finalPolygonRef.current)
      if (existingLayerRef.current) map.removeLayer(existingLayerRef.current)
      map.doubleClickZoom.enable()
      map.getContainer().style.cursor = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Map event handlers (via useMapEvents — no stale closure issues) ────────

  useMapEvents({
    click(e) {
      if (!isDrawingRef.current) return

      const newPts = [...pointsRef.current, e.latlng]
      pointsRef.current = newPts
      setPointCount(newPts.length)
      drawPreview(newPts)
    },
    dblclick(e) {
      if (!isDrawingRef.current) return
      if (pointsRef.current.length >= 3) {
        L.DomEvent.stopPropagation(e)
        finishDrawing()
      }
    },
  })

  // ─── Actions ────────────────────────────────────────────────────────────────

  function startDrawing() {
    // Clear existing layers
    clearPreview()
    if (finalPolygonRef.current) { map.removeLayer(finalPolygonRef.current); finalPolygonRef.current = null }
    if (existingLayerRef.current) { map.removeLayer(existingLayerRef.current); existingLayerRef.current = null }

    pointsRef.current = []
    isDrawingRef.current = true
    setPhase('drawing')
    setPointCount(0)
    map.doubleClickZoom.disable()
    map.getContainer().style.cursor = 'crosshair'
  }

  function finishDrawing() {
    const pts = pointsRef.current
    if (pts.length < 3) return

    clearPreview()
    isDrawingRef.current = false
    map.doubleClickZoom.enable()
    map.getContainer().style.cursor = ''

    drawFinalPolygon(pts)
    setPhase('done')
    setPointCount(pts.length)
  }

  function undoLastPoint() {
    if (!isDrawingRef.current || pointsRef.current.length === 0) return
    const newPts = pointsRef.current.slice(0, -1)
    pointsRef.current = newPts
    setPointCount(newPts.length)
    drawPreview(newPts)
  }

  function handleClearAll() {
    clearPreview()
    if (finalPolygonRef.current) { map.removeLayer(finalPolygonRef.current); finalPolygonRef.current = null }
    if (existingLayerRef.current) { map.removeLayer(existingLayerRef.current); existingLayerRef.current = null }
    pointsRef.current = []
    isDrawingRef.current = false
    map.doubleClickZoom.enable()
    map.getContainer().style.cursor = ''
    setPhase('idle')
    setPointCount(0)
  }

  function handleSave() {
    map.doubleClickZoom.enable()
    map.getContainer().style.cursor = ''
    if (finalPolygonRef.current) {
      onSave(JSON.stringify(finalPolygonRef.current.toGeoJSON()))
    } else {
      onSave(null)
    }
  }

  function handleClose() {
    map.doubleClickZoom.enable()
    map.getContainer().style.cursor = ''
    onClose()
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  const base: React.CSSProperties = {
    fontFamily: "'Inter',sans-serif",
    fontSize: 12,
    background: '#1B2A1F',
    border: '1px solid rgba(242,237,224,0.15)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }

  const btn = (bg: string, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    background: bg, color,
    border: 'none',
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: "'Inter',sans-serif",
    ...extra,
  })

  return (
    <div
      ref={panelRef}
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[2000]"
      style={{ ...base, borderRadius: 16, minWidth: 340 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: '1px solid rgba(242,237,224,0.1)' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(242,237,224,0.45)', fontFamily: "'JetBrains Mono',monospace" }}>
            GAMBAR KANDANG
          </div>
          <div style={{ fontSize: 13, color: '#E2B883', fontWeight: 600 }}>{farm.nama}</div>
        </div>
        <button
          onClick={handleClose}
          style={{ background: 'none', border: 'none', color: 'rgba(242,237,224,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {phase === 'idle' && (
          <div className="flex flex-col gap-3">
            <p style={{ fontSize: 12, color: 'rgba(242,237,224,0.6)', lineHeight: 1.6 }}>
              {farm.geojson
                ? 'Farm ini sudah memiliki area kandang. Klik "Gambar Ulang" untuk menggambar baru.'
                : 'Klik "Mulai Gambar" lalu klik pada peta untuk menambahkan titik polygon area kandang.'}
            </p>
            <div className="flex gap-2">
              <button style={btn('#C7873E', '#1B2A1F', { fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 })} onClick={startDrawing}>
                <PenLine size={13} />
                {farm.geojson ? 'Gambar Ulang' : 'Mulai Gambar'}
              </button>
              {farm.geojson && (
                <button style={btn('rgba(181,68,59,0.25)', '#FF9B94', { display: 'flex', alignItems: 'center', gap: 5 })} onClick={() => { handleClearAll(); onSave(null) }}>
                  <Trash2 size={12} />
                  Hapus Area
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'drawing' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'rgba(242,237,224,0.7)', lineHeight: 1.5 }}>
                <strong style={{ color: '#F2EDE0' }}>{pointCount} titik</strong> ditambahkan.
                {pointCount < 3
                  ? ` Tambah ${3 - pointCount} titik lagi untuk membentuk polygon.`
                  : ' Klik "Selesai" atau double-click untuk menutup polygon.'}
              </p>
            </div>
            <div className="flex gap-2">
              {pointCount >= 3 && (
                <button style={btn('#3F5B3A', '#F2EDE0', { fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 })} onClick={finishDrawing}>
                  <Check size={13} />
                  Selesai Gambar
                </button>
              )}
              {pointCount > 0 && (
                <button style={btn('rgba(242,237,224,0.1)', 'rgba(242,237,224,0.7)', { display: 'flex', alignItems: 'center', gap: 5 })} onClick={undoLastPoint}>
                  <Undo2 size={12} />
                  Undo
                </button>
              )}
              <button style={btn('rgba(181,68,59,0.2)', '#FF9B94', { display: 'flex', alignItems: 'center', gap: 5 })} onClick={handleClearAll}>
                <X size={12} />
                Batal
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} color="#4ade80" strokeWidth={1.5} />
              <p style={{ fontSize: 12, color: 'rgba(242,237,224,0.7)', lineHeight: 1.5 }}>
                Polygon berhasil digambar dengan <strong style={{ color: '#F2EDE0' }}>{pointCount} titik</strong>.
                Klik "Simpan" untuk menyimpan ke database.
              </p>
            </div>
            <div className="flex gap-2">
              <button style={btn('#C7873E', '#1B2A1F', { fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 })} onClick={handleSave}>
                <Save size={13} />
                Simpan Area Kandang
              </button>
              <button style={btn('rgba(242,237,224,0.1)', 'rgba(242,237,224,0.7)', { display: 'flex', alignItems: 'center', gap: 5 })} onClick={startDrawing}>
                <RefreshCw size={12} />
                Ulang
              </button>
              <button style={btn('rgba(181,68,59,0.2)', '#FF9B94', { display: 'flex', alignItems: 'center', gap: 5 })} onClick={handleClearAll}>
                <Trash2 size={12} />
                Hapus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
