/* ═══ AI Pattern Detection ════════════════════════════════════════════════
   Correlation-style insight cards generated from the athlete's own match
   log — rest days, venue, position, and result all compared against
   rating. Each card shows the two numbers behind the claim, not just the
   claim itself, so nothing feels like an unverifiable black box. */
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { color, font, ease } from '@/design/tokens'
import type { PatternInsight } from '@/lib/performanceIntel'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function InsightCards({ insights }: { insights: PatternInsight[] }) {
  if (insights.length === 0) return null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {insights.map((insight, i) => <InsightCard key={insight.id} insight={insight} index={i} />)}
    </div>
  )
}

function InsightCard({ insight, index }: { insight: PatternInsight; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const max = Math.max(insight.a.value, insight.b.value, 0.01)

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay: index * 0.1, ease }}
      className="rounded-xl border p-5" style={{ borderColor: color.border, background: color.surface }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.ink, lineHeight: 1.25 }}>{insight.title}</p>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(255,90,60,0.12)', color: color.accentSoft }}>
          {insight.confidence}%
        </span>
      </div>
      <p style={{ ...B, fontSize: '0.82rem', lineHeight: 1.6, color: color.inkDim }} className="mb-4">{insight.body}</p>

      {/* mini comparison viz */}
      <div className="space-y-2 mb-4">
        {[insight.a, insight.b].map(bar => (
          <div key={bar.label} className="flex items-center gap-2.5">
            <span style={{ ...B, fontSize: '0.68rem', color: color.inkMuted, width: 78 }} className="shrink-0 truncate">{bar.label}</span>
            <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(37,43,77,0.7)' }}>
              <motion.div className="h-full rounded-full" style={{ background: color.accent }}
                initial={{ width: 0 }} animate={inView ? { width: `${(bar.value / max) * 100}%` } : undefined}
                transition={{ duration: 0.9, delay: 0.2 + index * 0.1, ease }} />
            </div>
            <span style={{ ...B, fontSize: '0.7rem', color: color.ink, fontVariantNumeric: 'tabular-nums' }} className="shrink-0 w-8 text-right">
              {bar.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-3" style={{ background: 'rgba(255,90,60,0.06)', border: '1px solid rgba(255,90,60,0.16)' }}>
        <p style={{ ...BC, fontSize: '0.58rem', letterSpacing: '0.12em', color: color.accentSoft, fontWeight: 700 }} className="mb-1">RECOMMENDED ACTION</p>
        <p style={{ ...B, fontSize: '0.78rem', lineHeight: 1.5, color: color.inkDim }}>{insight.action}</p>
      </div>
    </motion.div>
  )
}
