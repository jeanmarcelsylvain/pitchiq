/* ═══ Data Coverage Card ══════════════════════════════════════════════════
   Shows the athlete exactly how complete their dataset is, and what to log
   next to strengthen it — never pressuring, always specific. */
import { motion } from 'framer-motion'
import { Database, Lightbulb } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { COVERAGE_LABEL, type DataCoverage } from '@/lib/aiTrust'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

const OVERALL_COLOR: Record<DataCoverage['overall'], string> = {
  excellent: '#2dd4a0', strong: '#4d9fff', growing: '#ffba08', limited: '#ff8a5c',
}

export function DataCoverageCard({ coverage, tips }: { coverage: DataCoverage; tips: string[] }) {
  const c = OVERALL_COLOR[coverage.overall]
  return (
    <div className="rounded-xl p-5" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" style={{ color: color.inkMuted }} />
          <p style={{ ...BC, fontSize: '0.68rem', letterSpacing: '0.1em', color: color.inkMuted, fontWeight: 700 }}>DATA COVERAGE</p>
        </div>
        <span className="rounded-full px-2.5 py-1" style={{ background: `${c}18`, border: `1px solid ${c}40` }}>
          <span style={{ ...BC, fontSize: '0.65rem', fontWeight: 700, color: c }}>{COVERAGE_LABEL[coverage.overall]}</span>
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {coverage.categories.map((cat, i) => (
          <div key={cat.key}>
            <div className="flex items-baseline justify-between mb-1">
              <span style={{ ...B, fontSize: '0.75rem', color: color.inkDim }}>{cat.label}</span>
              <span style={{ ...BC, fontSize: '0.72rem', color: color.ink, fontWeight: 700 }}>{cat.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(37,43,77,0.7)' }}>
              <motion.div className="h-full rounded-full" style={{ background: color.accent }}
                initial={{ width: 0 }} whileInView={{ width: `${cat.pct}%` }} viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.05, ease }} />
            </div>
            <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }} className="mt-0.5">{cat.note}</p>
          </div>
        ))}
      </div>

      {tips.length > 0 && (
        <div className="space-y-2 pt-3" style={{ borderTop: `1px solid ${color.border}` }}>
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#ffba08' }} aria-hidden />
              <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted, lineHeight: 1.5 }}>{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
