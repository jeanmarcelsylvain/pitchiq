/* ═══ Playing Style Engine ════════════════════════════════════════════════
   Classifies a football identity from the DNA profile + position mix, with
   confidence scaling on sample size and an evolution note comparing recent
   form to the season baseline. */
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import type { PlayingStyle as PlayingStyleT } from '@/lib/performanceIntel'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function PlayingStyleCard({ style }: { style: PlayingStyleT }) {
  return (
    <div className="relative overflow-hidden rounded-xl border p-6"
      style={{ borderColor: 'rgba(77,159,255,0.25)', background: 'linear-gradient(150deg, rgba(77,159,255,0.08), rgba(16,20,42,0.9) 55%)' }}>
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl" style={{ background: 'rgba(77,159,255,0.12)' }} />
      <div className="relative flex items-center gap-2 mb-1">
        <Sparkles className="h-3.5 w-3.5" style={{ color: color.ai }} aria-hidden />
        <span style={{ ...BC, fontSize: '0.62rem', letterSpacing: '0.16em', color: color.ai, fontWeight: 700 }}>YOUR FOOTBALL IDENTITY</span>
      </div>
      <motion.h3
        key={style.label}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        style={{ ...BC, fontSize: 'clamp(1.75rem,3vw,2.5rem)', fontWeight: 800, color: color.ink, letterSpacing: '-0.01em' }}
        className="relative mt-1">
        {style.label}
      </motion.h3>

      <div className="relative mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(37,43,77,0.8)' }}>
          <motion.div className="h-full rounded-full" style={{ background: color.ai }}
            initial={{ width: 0 }} animate={{ width: `${style.confidence}%` }} transition={{ duration: 1, delay: 0.2, ease }} />
        </div>
        <span style={{ ...B, fontSize: '0.75rem', color: color.ai, fontWeight: 600 }} className="shrink-0">{style.confidence}% confidence</span>
      </div>

      <ul className="relative mt-5 space-y-2">
        {style.evidence.map((e, i) => (
          <motion.li key={e} className="flex gap-2.5 text-[13px]"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease }}
            style={{ ...B, color: color.inkDim, lineHeight: 1.5 }}>
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: color.ai }} />
            {e}
          </motion.li>
        ))}
      </ul>

      <p className="relative mt-5 pt-4 text-[13px] leading-relaxed" style={{ ...B, color: color.inkMuted, borderTop: `1px solid ${color.border}` }}>
        {style.evolving}
      </p>
    </div>
  )
}
