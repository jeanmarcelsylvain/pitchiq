/* ═══ Improvement Momentum ════════════════════════════════════════════════
   One state, framed optimistically even when the news is a dip — every
   branch of the classifier ends in something actionable. */
import { TrendingUp, Minus, TrendingDown, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { color, font, ease } from '@/design/tokens'
import type { Momentum } from '@/lib/performanceIntel'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

const CONFIG = {
  accelerating: { icon: TrendingUp, color: color.emerald, bg: 'rgba(45,212,160,0.08)', border: 'rgba(45,212,160,0.25)' },
  plateau:      { icon: Minus, color: color.warn, bg: 'rgba(255,186,8,0.07)', border: 'rgba(255,186,8,0.22)' },
  decline:      { icon: TrendingDown, color: color.danger, bg: 'rgba(255,77,94,0.07)', border: 'rgba(255,77,94,0.22)' },
  recovering:   { icon: RotateCcw, color: color.ai, bg: 'rgba(77,159,255,0.07)', border: 'rgba(77,159,255,0.22)' },
} as const

export function MomentumCard({ momentum }: { momentum: Momentum }) {
  const cfg = CONFIG[momentum.state]
  const Icon = cfg.icon
  const path = sparkPath(momentum.spark)

  return (
    <div className="rounded-xl border p-5 flex flex-col sm:flex-row gap-5 items-center" style={{ borderColor: cfg.border, background: cfg.bg }}>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: `${cfg.color}20` }}>
        <Icon className="h-6 w-6" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1">
        <p style={{ ...BC, fontSize: '1.15rem', fontWeight: 800, color: color.ink }}>{momentum.label}</p>
        <p style={{ ...B, fontSize: '0.82rem', color: color.inkDim, lineHeight: 1.55 }} className="mt-1 max-w-md">{momentum.description}</p>
      </div>
      <svg viewBox="0 0 120 40" className="w-28 shrink-0" aria-hidden>
        <motion.path d={path} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.2, ease }} />
      </svg>
    </div>
  )
}

function sparkPath(values: number[]) {
  if (values.length < 2) return 'M0,20 L120,20'
  const max = Math.max(...values), min = Math.min(...values)
  const range = Math.max(max - min, 0.5)
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * 120
    const y = 36 - ((v - min) / range) * 32
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}
