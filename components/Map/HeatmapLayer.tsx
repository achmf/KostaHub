'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Farm } from './MapPageClient'

// Augment window with L for leaflet.heat CDN compatibility
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HeatLayer = L.Layer & { setLatLngs: (pts: [number, number, number][]) => void; [k: string]: any }

let heatScriptPromise: Promise<void> | null = null

function loadHeatScript(): Promise<void> {
  if (heatScriptPromise) return heatScriptPromise

  heatScriptPromise = new Promise<void>((resolve, reject) => {
    // CRITICAL: expose our module L as window.L so leaflet.heat CDN can patch it
    if (typeof window !== 'undefined') {
      window.L = L
    }

    if (document.getElementById('leaflet-heat-script')) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = 'leaflet-heat-script'
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      // After CDN load, window.L.heatLayer should be patched onto L
      resolve()
    }
    script.onerror = () => {
      heatScriptPromise = null // allow retry
      reject(new Error('leaflet.heat CDN failed'))
    }
    document.head.appendChild(script)
  })

  return heatScriptPromise
}

interface Props {
  farms: Farm[]
}

export default function HeatmapLayer({ farms }: Props) {
  const map = useMap()
  const heatRef = useRef<HeatLayer | null>(null)

  useEffect(() => {
    const validFarms = farms.filter(f => f.lat && f.lng)
    if (validFarms.length === 0) return

    // Use _count.hewan as intensity — fall back to 1 if all 0
    const maxHewan = Math.max(...validFarms.map(f => f._count.hewan), 1)

    const points: [number, number, number][] = validFarms.map(f => [
      f.lat!,
      f.lng!,
      // Intensity: if all farms have 0 hewan, still show a dot at 0.5
      maxHewan > 0 ? (f._count.hewan / maxHewan) : 0.5,
    ])

    loadHeatScript()
      .then(() => {
        // L is patched by CDN script via window.L — access heatLayer from it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const heatFn = (window.L as any)?.heatLayer ?? (L as any).heatLayer
        if (typeof heatFn !== 'function') {
          console.error('[HeatmapLayer] heatLayer function not available after script load')
          return
        }

        // Remove previous
        if (heatRef.current) {
          map.removeLayer(heatRef.current)
          heatRef.current = null
        }

        const heat = heatFn(points, {
          radius: 55,
          blur: 35,
          maxZoom: 16,
          max: 1.0,
          minOpacity: 0.35,
          gradient: {
            0.0: '#1B2A1F',
            0.3: '#3F5B3A',
            0.55: '#C7873E',
            0.8: '#E8A855',
            1.0: '#FFD580',
          },
        }) as HeatLayer

        heat.addTo(map)
        heatRef.current = heat
      })
      .catch(err => console.error('[HeatmapLayer]', err))

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
        heatRef.current = null
      }
    }
  }, [farms, map])

  return null
}
