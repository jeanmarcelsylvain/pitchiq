/* ═══ Evidence Panel ══════════════════════════════════════════════════════
   The "Why?" behind every significant AI insight in Performance Lab.
   Expandable, calm, never technical-feeling — this is the trust mechanism
   the whole phase is built around. */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sparkles, TrendingUp, Clock, Database, ArrowRight } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { Evidence } from '@/lib/aiTrust'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function EvidencePanel({ evidence }: { evidence: Evidence }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${color.border}` }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-white/[0.02]">
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" style={{ color: color.ai }} aria-hidden />
          <span style={{ ...BC, fontSize: '0.7rem', letterSpacing: '0.08em', color: color.ai, fontWeight: 700 }}>WHY?</span>
        </span>
        <span className="flex items-center gap-2">
          <ConfidenceBadge level={evidence.confidence} compact />
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown className="h-3.5 w-3.5" style={{ color: color.inkMuted }} />
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }} style={{ overflow: 'hidden' }}>
            <div className="px-3.5 pb-3.5 pt-1 space-y-3" style={{ borderTop: `1px solid ${color.border}` }}>
              <Section icon={TrendingUp} label="Primary Evidence" lines={evidence.primary} color={color.emerald} />
              {evidence.supporting.length > 0 && <Section icon={Database} label="Supporting Metrics" lines={evidence.supporting} color={color.ai} />}
              {evidence.historicalContext.length > 0 && <Section icon={Clock} label="Historical Context" lines={evidence.historicalContext} color={color.inkMuted} />}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${color.border}` }}>
                <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>{evidence.dataCoverage}</p>
              </div>
              <div className="flex items-start gap-2 rounded-md p-2.5" style={{ background: 'rgba(255,90,60,0.06)' }}>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: color.accentSoft }} aria-hidden />
                <p style={{ ...B, fontSize: '0.75rem', color: color.inkDim, lineHeight: 1.5 }}>{evidence.nextStep}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ icon: Icon, label, lines, color: c }: { icon: typeof TrendingUp; label: string; lines: string[]; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3" style={{ color: c }} aria-hidden />
        <p style={{ fontFamily: font.display, fontSize: '0.62rem', letterSpacing: '0.1em', color: c, fontWeight: 700 }}>{label.toUpperCase()}</p>
      </div>
      <ul className="space-y-1">
        {lines.map((l, i) => (
          <li key={i} style={{ fontFamily: font.ui, fontSize: '0.78rem', color: color.inkDim, lineHeight: 1.5 }} className="pl-3.5 relative before:absolute before:left-0 before:content-['•']" >
            {l}
          </li>
        ))}
      </ul>
    </div>
  )
}
