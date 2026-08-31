'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SilsilahNode } from '@/lib/silsilah'
import { palette } from '@/components/KostaUI'

type NodeProps = {
  node: SilsilahNode
  side?: 'bapak' | 'induk' | 'root'
  depth?: number
}

function SilsilahNodeCard({ node, side = 'root', depth = 0 }: NodeProps) {
  const [isBapakOpen, setIsBapakOpen] = useState(depth < 1)
  const [isIndukOpen, setIsIndukOpen] = useState(depth < 1)

  const hasBapak = !!node.bapak
  const hasInduk = !!node.induk
  const hasParents = hasBapak || hasInduk

  const accentColor = side === 'bapak' ? palette.moss : side === 'induk' ? palette.ochre : palette.forest
  const accentBg = side === 'bapak' ? 'rgba(63,91,58,0.08)' : side === 'induk' ? 'rgba(199,135,62,0.08)' : 'rgba(27,42,31,0.08)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Node card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: depth * 0.05 }}
        style={{
          background: depth === 0 ? palette.forest : '#fff',
          border: `1.5px solid ${depth === 0 ? 'transparent' : accentColor}`,
          borderRadius: 14,
          padding: '10px 16px',
          minWidth: 140,
          maxWidth: 180,
          position: 'relative',
          boxShadow: depth === 0 ? '0 4px 20px rgba(27,42,31,0.25)' : '0 1px 6px rgba(13,20,15,0.07)',
          cursor: hasParents ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (!hasParents) return
          setIsBapakOpen((v) => !v)
          setIsIndukOpen((v) => !v)
        }}
      >
        {/* Gender icon + side indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9,
            letterSpacing: '0.12em',
            color: depth === 0 ? 'rgba(242,237,224,0.55)' : accentColor,
            textTransform: 'uppercase',
          }}>
            {node.kelamin === 'JANTAN' ? '♂ Jantan' : '♀ Induk'}
          </span>
          {hasParents && (
            <span style={{ color: depth === 0 ? 'rgba(242,237,224,0.55)' : accentColor, lineHeight: 1 }}>
              {(isBapakOpen || isIndukOpen) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </span>
          )}
        </div>

        {/* Tag */}
        <div style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10.5,
          letterSpacing: '0.08em',
          color: depth === 0 ? 'rgba(242,237,224,0.75)' : 'rgba(13,20,15,0.55)',
          marginBottom: 3,
        }}>
          {node.tag}
        </div>

        {/* Name */}
        <div style={{
          fontFamily: "'Fraunces',serif",
          fontSize: 15,
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
          color: depth === 0 ? palette.cream : palette.ink,
        }}>
          {node.nama || '—'}
        </div>

        {/* Lahir */}
        <div style={{
          fontFamily: "'Inter',sans-serif",
          fontSize: 10,
          color: depth === 0 ? 'rgba(242,237,224,0.45)' : 'rgba(13,20,15,0.4)',
          marginTop: 4,
        }}>
          {new Date(node.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </motion.div>

      {/* Connector + children */}
      {hasParents && (
        <AnimatePresence>
          {(isBapakOpen || isIndukOpen) && (
            <motion.div
              key="children"
              initial={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
              exit={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden', width: '100%', transformOrigin: 'top' }}
            >
              {/* Vertical line from card */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 24, background: palette.borderStrong }} />
              </div>

              {/* Horizontal connector + child nodes */}
              <div style={{ display: 'flex', width: '100%', position: 'relative', justifyContent: 'center' }}>
                {hasBapak && node.bapak && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 12px', position: 'relative' }}>
                    {hasInduk && (
                      <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: 2, background: palette.borderStrong }} />
                    )}
                    <div style={{ width: 2, height: 24, background: palette.moss }} />
                    <SilsilahNodeCard node={node.bapak} side="bapak" depth={depth + 1} />
                  </div>
                )}

                {hasInduk && node.induk && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 12px', position: 'relative' }}>
                    {hasBapak && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: 2, background: palette.borderStrong }} />
                    )}
                    <div style={{ width: 2, height: 24, background: palette.ochre }} />
                    <SilsilahNodeCard node={node.induk} side="induk" depth={depth + 1} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

export function SilsilahTree({ tree }: { tree: SilsilahNode | null }) {
  if (!tree) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 0',
        fontFamily: "'Fraunces',serif",
        fontSize: 18,
        fontStyle: 'italic',
        color: palette.moss,
      }}>
        Silsilah belum tercatat.
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontStyle: 'normal', color: 'rgba(13,20,15,0.5)', marginTop: 8 }}>
          Edit data kambing untuk menautkan bapak dan induknya.
        </div>
      </div>
    )
  }

  const hasBapak = !!tree.bapak
  const hasInduk = !!tree.induk

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: palette.moss }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.1em', color: 'rgba(13,20,15,0.55)' }}>JALUR JANTAN ♂</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: palette.ochre }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.1em', color: 'rgba(13,20,15,0.55)' }}>JALUR INDUK ♀</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: palette.forest }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.1em', color: 'rgba(13,20,15,0.55)' }}>HEWAN INI</span>
        </div>
        {!hasBapak && !hasInduk && (
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(13,20,15,0.45)', marginLeft: 'auto' }}>
            Klik node untuk expand generasi
          </span>
        )}
      </div>

      {/* Tree */}
      <div style={{ display: 'flex', justifyContent: 'center', minWidth: 'max-content', margin: '0 auto' }}>
        <SilsilahNodeCard node={tree} side="root" depth={0} />
      </div>
    </div>
  )
}
