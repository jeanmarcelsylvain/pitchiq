/* ═══ AI Highlights + Mood History ════════════════════════════════════════
   Season-wide superlatives and a reflection-trend sparkline set — the
   "this is a career archive, not a spreadsheet" widgets atop the journal. */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { color, font, ease } from '@/design/tokens'
import { buildHighlights, buildMoodHistory } from '@/lib/matchIntel'
import type { Match } from '@/types'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function AIHighlights({ matches, onOpen }: { matches: Match[]; onOpen: (m: Match) => void }) {
  const highlights = buildHighlights(matches)
  if (highlights.length === 0) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {highlights.map((h, i) => (
        <motion.button key={h.label} onClick={() => onOpen(h.match)}
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.06, ease }}
          whileHover={{ y: -2 }}
          className="rounded-xl p-3.5 text-left transition-colors glass">
          <p style={{ ...BC, fontSize: '0.58rem', letterSpacing: '0.1em', color: color.inkMuted, fontWeight: 700 }}>{h.label.toUpperCase()}</p>
          <p style={{ ...BC, fontSize: '1.3rem', fontWeight: 800, color: color.accentSoft }} className="mt-1">{h.value}</p>
          <p style={{ ...B, fontSize: '0.66rem', color: color.inkMuted }} className="truncate">vs {h.match.opponent}</p>
        </motion.button>
      ))}
    </div>
  )
}

const MOOD_METRICS: { key: 'confidence' | 'energy' | 'focus' | 'fatigue' | 'enjoyment'; label: string; color: string }[] = [
  { key: 'confidence', label: 'Confidence', color: '#ff5a3c' },
  { key: 'energy', label: 'Energy', color: '#ffba08' },
  { key: 'focus', label: 'Focus', color: '#4d9fff' },
  { key: 'enjoyment', label: 'Enjoyment', color: '#2dd4a0' },
  { key: 'fatigue', label: 'Fatigue', color: '#ff4d5e' },
]

export function MoodHistory({ matches }: { matches: Match[] }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const points = buildMoodHistory(matches)
  if (points.length < 2) return null

  return (
    <div ref={ref}>
      <p style={{ ...B, fontSize: '0.78rem', color: color.inkMuted, lineHeight: 1.5 }} className="mb-4">
        From your Match Reflections — how confidence, energy, and fatigue have moved across {points.length} reflected matches.
      </p>
      <div className="space-y-4">
        {MOOD_METRICS.map(metric => {
          const values = points.map(p => p[metric.key]).filter((v): v is number => v !== undefined)
          if (values.length < 2) return null
          const path = sparkPath(values)
          const latest = values[values.length - 1]
          return (
            <div key={metric.key} className="flex items-center gap-4">
              <div className="w-20 shrink-0">
                <p style={{ ...B, fontSize: '0.72rem', color: color.inkDim }}>{metric.label}</p>
                <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: metric.color }}>{latest}<span style={{ fontSize: '0.6rem', color: color.inkMuted }}>/10</span></p>
              </div>
              <svg viewBox="0 0 200 32" className="flex-1" aria-hidden>
                <motion.path d={path} fill="none" stroke={metric.color} strokeWidth="2" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : undefined}
                  transition={{ duration: 1, ease }} />
              </svg>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function sparkPath(values: number[]) {
  const max = 10, min = 0
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * 200
    const y = 28 - ((v - min) / (max - min)) * 24
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}
