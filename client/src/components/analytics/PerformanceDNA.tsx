/* ═══ Performance DNA — the signature visualization ══════════════════════════
   Deliberately not a radar chart. Seven attributes radiate from a living
   core as arcs of varying length and glow; selecting one opens a detail
   panel with the why, the trend, and the fix. Built to feel like it's
   growing rather than being plotted. */
import { useState, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import type { DNAAttribute } from '@/lib/performanceIntel'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

const RING_COLORS = ['#ff5a3c', '#ff7a60', '#4d9fff', '#2dd4a0', '#ffba08', '#a78bfa', '#ff4d9e']

const R_INNER = 58
const R_OUTER = 132
const GAP_DEG = 3.2

export function PerformanceDNA({ attributes }: { attributes: DNAAttribute[] }) {
  const [active, setActive] = useState<number>(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })
  const reduced = useReducedMotion()
  const show = inView || !!reduced

  const n = attributes.length
  const segAngle = 360 / n - GAP_DEG
  const selected = attributes[active]

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[auto_1fr] items-center">
      {/* ── the ring ────────────────────────────────────────────────────── */}
      <div className="relative mx-auto" style={{ width: 320, height: 320 }}>
        <svg viewBox="-160 -160 320 320" width={320} height={320} className="overflow-visible">
          {attributes.map((attr, i) => {
            const startAngle = -90 + i * (segAngle + GAP_DEG)
            const isActive = i === active
            const arcColor = RING_COLORS[i % RING_COLORS.length]
            const valueAngle = (attr.value / 100) * segAngle
            const trackPath = describeArc(0, 0, R_INNER, R_OUTER, startAngle, startAngle + segAngle)
            const zeroPath = describeArc(0, 0, R_INNER, R_OUTER, startAngle, startAngle)
            const fillPath = describeArc(0, 0, R_INNER, R_OUTER, startAngle, startAngle + valueAngle)
            return (
              <g key={attr.key}>
                <path d={trackPath} fill="rgba(37,43,77,0.55)" />
                <motion.path
                  initial={reduced ? { d: fillPath, opacity: isActive ? 1 : 0.72 } : { d: zeroPath, opacity: 0 }}
                  animate={show ? { d: fillPath, opacity: isActive ? 1 : 0.72 } : undefined}
                  transition={{ duration: 1.1, delay: 0.15 + i * 0.07, ease }}
                  fill={arcColor}
                  style={{ cursor: 'pointer', filter: isActive ? `drop-shadow(0 0 10px ${arcColor}80)` : 'none' }}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${attr.label}: ${attr.value.toFixed(0)} out of 100`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActive(i) }}
                />
              </g>
            )
          })}
          {/* core */}
          <motion.circle r={R_INNER - 8} fill="none" stroke={color.border} strokeWidth="1" />
          <motion.circle r={3} fill={color.accent}
            animate={reduced ? undefined : { r: [3, 5, 3] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
        </svg>

        {/* center readout */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span style={{ ...BC, fontSize: '0.55rem', letterSpacing: '0.16em', color: RING_COLORS[active % RING_COLORS.length] }}>
            {selected.label.toUpperCase()}
          </span>
          <span style={{ ...BC, fontSize: '2.5rem', fontWeight: 800, color: color.ink, lineHeight: 1, marginTop: 4 }}>
            {selected.value.toFixed(0)}
          </span>
          <span style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>out of 100</span>
        </div>
      </div>

      {/* ── legend + detail panel ──────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap gap-2 mb-5">
          {attributes.map((attr, i) => (
            <button key={attr.key} onClick={() => setActive(i)}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all"
              style={{
                borderColor: i === active ? RING_COLORS[i % RING_COLORS.length] : color.border,
                background: i === active ? `${RING_COLORS[i % RING_COLORS.length]}18` : 'transparent',
                color: i === active ? RING_COLORS[i % RING_COLORS.length] : color.inkMuted,
              }}>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: RING_COLORS[i % RING_COLORS.length] }} />
              {attr.label}
            </button>
          ))}
        </div>

        <motion.div key={selected.key}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
          className="rounded-xl border p-5" style={{ borderColor: color.border, background: color.surface }}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p style={{ ...BC, fontSize: '1.1rem', fontWeight: 700, color: color.ink }}>{selected.label}</p>
              <p style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }}>Based on {selected.matches} logged matches</p>
            </div>
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
              style={{
                background: selected.trend > 0.5 ? 'rgba(45,212,160,0.12)' : selected.trend < -0.5 ? 'rgba(255,77,94,0.12)' : 'rgba(154,151,184,0.12)',
                color: selected.trend > 0.5 ? color.emerald : selected.trend < -0.5 ? color.danger : color.inkMuted,
              }}>
              {selected.trend > 0.5 ? <TrendingUp className="h-3 w-3" /> : selected.trend < -0.5 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {selected.trend > 0.5 ? '+' : ''}{selected.trend.toFixed(1)} recent
            </span>
          </div>
          <p style={{ ...B, fontSize: '0.85rem', lineHeight: 1.6, color: color.inkDim }} className="mb-4">
            {selected.explain}
          </p>
          <div className="rounded-lg p-3" style={{ background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.18)' }}>
            <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.12em', color: color.ai, fontWeight: 700 }} className="mb-1">HOW TO IMPROVE</p>
            <p style={{ ...B, fontSize: '0.8rem', lineHeight: 1.55, color: color.inkDim }}>{selected.improve}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ── SVG donut-segment arc path helper ────────────────────────────────────── */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, rInner: number, rOuter: number, startAngle: number, endAngle: number) {
  const safeEnd = Math.max(startAngle + 0.01, endAngle)
  const p1 = polarToCartesian(cx, cy, rOuter, safeEnd)
  const p2 = polarToCartesian(cx, cy, rOuter, startAngle)
  const p3 = polarToCartesian(cx, cy, rInner, startAngle)
  const p4 = polarToCartesian(cx, cy, rInner, safeEnd)
  const largeArc = safeEnd - startAngle <= 180 ? 0 : 1
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ')
}
