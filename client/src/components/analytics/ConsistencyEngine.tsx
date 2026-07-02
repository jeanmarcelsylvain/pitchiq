/* ═══ Consistency Engine ══════════════════════════════════════════════════
   Volatility, inverted into a 0-100 "consistency score" per metric, with a
   rolling-window sparkline showing whether stability is improving. */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { color, font, ease } from '@/design/tokens'
import type { ConsistencyMetric } from '@/lib/performanceIntel'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function ConsistencyEngine({ metrics }: { metrics: ConsistencyMetric[] }) {
  if (metrics.length === 0) return null
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {metrics.map((m, i) => <MetricCard key={m.label} metric={m} index={i} />)}
    </div>
  )
}

function MetricCard({ metric, index }: { metric: ConsistencyMetric; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const tier = metric.score >= 75 ? color.emerald : metric.score >= 50 ? color.warn : color.danger
  const path = sparkPath(metric.spark)

  return (
    <motion.div ref={ref} className="rounded-xl border p-4" style={{ borderColor: color.border, background: color.surface }}
      initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay: index * 0.08, ease }}>
      <div className="flex items-baseline justify-between mb-1">
        <p style={{ ...BC, fontSize: '0.85rem', fontWeight: 700, color: color.ink }}>{metric.label}</p>
        <p style={{ ...BC, fontSize: '1.25rem', fontWeight: 800, color: tier }}>{metric.score.toFixed(0)}</p>
      </div>
      <svg viewBox="0 0 120 30" className="w-full mb-2" aria-hidden>
        <motion.path d={path} fill="none" stroke={tier} strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : undefined}
          transition={{ duration: 1, delay: 0.2 + index * 0.08, ease }} />
      </svg>
      <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted, lineHeight: 1.5 }}>{metric.note}</p>
    </motion.div>
  )
}

function sparkPath(values: number[]) {
  if (values.length < 2) return 'M0,15 L120,15'
  const max = Math.max(...values, 1), min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * 120
    const y = 28 - ((v - min) / range) * 26
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}
