/* ═══ Annotation Overlay — drawing on the frame ══════════════════════════════
   Arrows, circles and text notes placed directly on the video, normalized to
   0–1 coordinates so they scale with the player. Only shown near the moment
   they were made (±1.5s) so the frame doesn't fill up with every annotation
   at once — click one in the list to jump straight to it instead. */
import { useState } from 'react'
import { color, font } from '@/design/tokens'
import type { Annotation, AnnotationShape } from '@/lib/videoStudio'

const B = { fontFamily: font.ui }

interface Props {
  annotations: Annotation[]
  currentTime: number
  placing: { shape: AnnotationShape; color: string } | null
  onPlace: (a: { shape: AnnotationShape; x: number; y: number; x2?: number; y2?: number; text?: string }) => void
}

export function AnnotationOverlay({ annotations, currentTime, placing, onPlace }: Props) {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [textPoint, setTextPoint] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState('')

  const visible = annotations.filter(a => Math.abs(a.time - currentTime) < 1.5)

  const norm = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
  }

  const handleDown = (e: React.MouseEvent) => {
    if (!placing) return
    const p = norm(e)
    if (placing.shape === 'circle') { onPlace({ shape: 'circle', x: p.x, y: p.y }); return }
    if (placing.shape === 'text') { setTextPoint(p); return }
    setDragStart(p)
  }
  const handleUp = (e: React.MouseEvent) => {
    if (!placing || placing.shape !== 'arrow' || !dragStart) return
    const p = norm(e)
    onPlace({ shape: 'arrow', x: dragStart.x, y: dragStart.y, x2: p.x, y2: p.y })
    setDragStart(null)
  }
  const confirmText = () => {
    if (textPoint && textValue.trim()) onPlace({ shape: 'text', x: textPoint.x, y: textPoint.y, text: textValue.trim() })
    setTextPoint(null); setTextValue('')
  }

  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: placing ? 'auto' : 'none', cursor: placing ? 'crosshair' : 'default' }}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
    >
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
        {visible.map(a => {
          if (a.shape === 'circle') return <circle key={a.id} cx={`${a.x * 100}%`} cy={`${a.y * 100}%`} r={18} fill="none" stroke={a.color} strokeWidth={3} />
          if (a.shape === 'arrow' && a.x2 !== undefined && a.y2 !== undefined)
            return (
              <g key={a.id}>
                <defs>
                  <marker id={`arrow-${a.id}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={a.color} /></marker>
                </defs>
                <line x1={`${a.x * 100}%`} y1={`${a.y * 100}%`} x2={`${a.x2 * 100}%`} y2={`${a.y2 * 100}%`} stroke={a.color} strokeWidth={3} markerEnd={`url(#arrow-${a.id})`} />
              </g>
            )
          return null
        })}
      </svg>
      {visible.filter(a => a.shape === 'text').map(a => (
        <div key={a.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md px-2 py-1"
          style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, ...B, fontSize: '0.7rem', background: 'rgba(10,13,28,0.85)', color: a.color, border: `1px solid ${a.color}` }}>
          {a.text}
        </div>
      ))}

      {textPoint && (
        <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1" style={{ left: `${textPoint.x * 100}%`, top: `${textPoint.y * 100}%`, pointerEvents: 'auto' }}
          onMouseDown={e => e.stopPropagation()}>
          <input autoFocus value={textValue} onChange={e => setTextValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmText()} onBlur={confirmText}
            placeholder="Note…" className="rounded-md px-2 py-1 text-xs outline-none"
            style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${placing?.color ?? color.accentSoft}`, width: 140 }} />
        </div>
      )}
    </div>
  )
}
