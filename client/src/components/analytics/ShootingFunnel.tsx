/* ═══ Shooting conversion — funnel, not a line chart ══════════════════════
   Shots → on target → goals, as three self-drawing horizontal bars with
   the conversion rate between each stage called out. Technical Analysis
   deliberately avoids repeating chart styles across its sub-sections. */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { color, font, ease } from '@/design/tokens'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

export function ShootingFunnel({ shots, onTarget, goals }: { shots: number; onTarget: number; goals: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const max = Math.max(shots, 1)

  const stages = [
    { label: 'Shots', value: shots, color: color.inkMuted },
    { label: 'On Target', value: onTarget, color: color.ai },
    { label: 'Goals', value: goals, color: color.accent },
  ]

  return (
    <div ref={ref} className="space-y-4">
      {stages.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-baseline justify-between mb-1.5">
            <span style={{ ...B, fontSize: '0.78rem', color: color.inkDim, fontWeight: 500 }}>{s.label}</span>
            <span style={{ ...MONO, fontSize: '0.85rem', color: color.ink }}>{s.value}</span>
          </div>
          <div className="h-7 rounded-md overflow-hidden" style={{ background: 'rgba(37,43,77,0.5)' }}>
            <motion.div className="h-full rounded-md" style={{ background: s.color }}
              initial={{ width: 0 }} animate={inView ? { width: `${(s.value / max) * 100}%` } : undefined}
              transition={{ duration: 1, delay: i * 0.18, ease }} />
          </div>
          {i < stages.length - 1 && (
            <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }} className="mt-1.5 ml-1">
              {stages[i].value > 0 ? `${((stages[i + 1].value / stages[i].value) * 100).toFixed(0)}% convert to ${stages[i + 1].label.toLowerCase()}` : ''}
            </p>
          )}
        </div>
      ))}
      <p style={{ ...BC, fontSize: '0.75rem', color: color.accentSoft, fontWeight: 700, paddingTop: '0.5rem' }}>
        {shots > 0 ? `${((goals / shots) * 100).toFixed(1)}% shot conversion overall` : 'Log a match with shots to see conversion'}
      </p>
    </div>
  )
}
