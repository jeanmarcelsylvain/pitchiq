/* ═══ Future Development — trend-projected estimates ═════════════════════
   Every number here is explicitly a projection, not a promise: a confidence
   band, not a single value, and a stated driver for why the model thinks
   what it thinks. */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import type { Projection } from '@/lib/performanceIntel'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function FutureDevelopment({ projections }: { projections: Projection[] }) {
  if (projections.length === 0) return null
  return (
    <div>
      <div className="flex items-start gap-2.5 rounded-lg p-3 mb-5" style={{ background: 'rgba(255,90,60,0.06)', border: '1px solid rgba(255,90,60,0.16)' }}>
        <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" style={{ color: color.accentSoft }} aria-hidden />
        <p style={{ ...B, fontSize: '0.76rem', lineHeight: 1.5, color: color.inkDim }}>
          <strong style={{ color: color.accentSoft }}>Estimates, not certainties.</strong> Each projection extrapolates your recent trend with a confidence range — the more matches logged, the tighter the range gets.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {projections.map((p, i) => <ProjectionCard key={p.key} p={p} index={i} />)}
      </div>
    </div>
  )
}

function ProjectionCard({ p, index }: { p: Projection; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref} className="rounded-xl border p-4" style={{ borderColor: color.border, background: color.surface }}
      initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay: index * 0.08, ease }}>
      <div className="flex items-baseline justify-between mb-2">
        <p style={{ ...BC, fontSize: '0.85rem', fontWeight: 700, color: color.ink }}>{p.label}</p>
        <p style={{ ...BC, fontSize: '1.5rem', fontWeight: 800, color: color.accentSoft }}>
          ~{p.projected.toFixed(0)}
        </p>
      </div>
      {/* confidence band */}
      <div className="relative h-2 rounded-full mb-1" style={{ background: 'rgba(37,43,77,0.7)' }}>
        <motion.div className="absolute h-full rounded-full" style={{ background: 'rgba(255,90,60,0.35)' }}
          initial={{ left: '50%', width: 0 }}
          animate={inView ? { left: `${p.low}%`, width: `${p.high - p.low}%` } : undefined}
          transition={{ duration: 0.8, delay: 0.15 + index * 0.08, ease }} />
        <motion.div className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2" style={{ borderColor: color.accent, background: color.bg }}
          initial={{ left: `${p.current}%` }}
          animate={inView ? { left: `${p.projected}%` } : undefined}
          transition={{ duration: 0.8, delay: 0.15 + index * 0.08, ease }} />
      </div>
      <div className="flex justify-between mb-3">
        <span style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>{p.low.toFixed(0)}</span>
        <span style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>{p.high.toFixed(0)} range</span>
      </div>
      <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted, lineHeight: 1.5 }}>{p.driver}</p>
    </motion.div>
  )
}
