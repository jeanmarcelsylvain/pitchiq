/* ═══ Match Comparison ════════════════════════════════════════════════════
   Two matches, animated bar-to-bar, with the delta and an AI explanation —
   never a plain two-column table. */
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { ModalShell, ModalHeader } from './JournalPrimitives'
import { compareMatches } from '@/lib/matchIntel'
import type { Match } from '@/types'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function MatchCompare({ a, b, onClose }: { a: Match; b: Match; onClose: () => void }) {
  const { rows, explanation } = compareMatches(a, b)

  return (
    <ModalShell onClose={onClose} maxWidth="40rem">
      <ModalHeader title="Match Comparison" subtitle={`vs ${a.opponent} (${a.date})  ·  vs ${b.opponent} (${b.date})`} onClose={onClose} />
      <div className="p-6">
        <div className="flex items-center gap-2 rounded-lg p-3 mb-6" style={{ background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.16)' }}>
          <Sparkles className="h-4 w-4 shrink-0" style={{ color: color.ai }} />
          <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.5 }}>{explanation}</p>
        </div>

        <div className="space-y-4">
          {rows.map((row, i) => {
            const aNum = typeof row.a === 'number' ? row.a : parseFloat(String(row.a))
            const bNum = typeof row.b === 'number' ? row.b : parseFloat(String(row.b))
            const max = Math.max(aNum, bNum, 0.01)
            const improved = row.delta !== null && row.delta > 0.01
            const declined = row.delta !== null && row.delta < -0.01
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <p style={{ ...BC, fontSize: '0.75rem', fontWeight: 700, color: color.inkDim }}>{row.label}</p>
                  {row.delta !== null && Math.abs(row.delta) >= 0.05 && (
                    <span style={{ ...BC, fontSize: '0.68rem', fontWeight: 700, color: improved ? color.emerald : declined ? color.danger : color.inkMuted }}>
                      {improved ? '+' : ''}{row.delta.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <BarRow label={String(row.a)} value={aNum} max={max} color={color.inkMuted} />
                  <BarRow label={String(row.b)} value={bNum} max={max} color={improved ? color.emerald : declined ? color.danger : color.accent} delay={0.05 * i} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ModalShell>
  )
}

function BarRow({ label, value, max, color: barColor, delay = 0 }: { label: string; value: number; max: number; color: string; delay?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(37,43,77,0.6)' }}>
        <motion.div className="h-full rounded-full" style={{ background: barColor }}
          initial={{ width: 0 }} whileInView={{ width: `${(value / max) * 100}%` }} viewport={{ once: true }}
          transition={{ duration: 0.7, delay, ease }} />
      </div>
      <span style={{ fontFamily: font.ui, fontSize: '0.72rem', color: barColor }}>{label}</span>
    </div>
  )
}
