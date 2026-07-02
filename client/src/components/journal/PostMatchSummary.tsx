/* ═══ Post-Match Summary ══════════════════════════════════════════════════
   The reward screen. Rating, comparisons, one AI observation, one focus
   area — celebratory without being flashy. */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { Counter } from '@/design/motion'
import { CareerMessage } from '@/components/ui/CareerMessage'
import type { Match } from '@/types'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function PostMatchSummary({ match, seasonAvgBefore, priorMatch, performanceScore, careerMessage }: {
  match: Omit<Match, 'id' | 'userId' | 'createdAt'>
  seasonAvgBefore: number | null
  priorMatch: Match | null
  performanceScore: number
  careerMessage: string
}) {
  const delta = seasonAvgBefore !== null ? match.rating - seasonAvgBefore : null

  const metrics = [
    { label: 'Goals', value: match.goals, prior: priorMatch?.goals },
    { label: 'Assists', value: match.assists, prior: priorMatch?.assists },
    { label: 'Pass Accuracy', value: `${match.passAccuracy}%`, prior: priorMatch ? `${priorMatch.passAccuracy}%` : undefined, raw: match.passAccuracy, priorRaw: priorMatch?.passAccuracy },
    { label: 'Sprint Speed', value: `${match.sprintSpeed} km/h`, raw: match.sprintSpeed, priorRaw: priorMatch?.sprintSpeed },
  ]
  const best = priorMatch
    ? metrics.filter(m => m.raw !== undefined && m.priorRaw !== undefined && m.raw > m.priorRaw)
        .sort((a, b) => ((b.raw! - b.priorRaw!) / (b.priorRaw! || 1)) - ((a.raw! - a.priorRaw!) / (a.priorRaw! || 1)))[0]
    : null

  let observation: string
  if (delta !== null && delta >= 1) observation = `This rating is well above your season average — one of your stronger outings.`
  else if (delta !== null && delta <= -1) observation = `Below your season average. Worth a look at Consistency Engine to see if a pattern is forming.`
  else if (match.passAccuracy >= 85) observation = `${match.passAccuracy}% pass accuracy is elite-tier for a single match.`
  else observation = `A solid, representative performance — right in line with your season form.`

  const focus = match.passAccuracy < 75
    ? 'Passing accuracy under pressure'
    : match.rating < 6.5
    ? 'Recovery and pre-match preparation'
    : 'Maintaining this level of output';

  const [messageDismissed, setMessageDismissed] = useState(false)

  return (
    <div className="text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease }}>
        <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.2em', color: color.inkMuted }} className="uppercase mb-2">Match Rating</p>
        <p style={{ ...BC, fontSize: '4rem', fontWeight: 900, color: color.accent, lineHeight: 1 }}>
          <Counter to={match.rating} decimals={1} />
        </p>
        {delta !== null && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: delta >= 0 ? 'rgba(45,212,160,0.3)' : 'rgba(255,186,8,0.3)',
              background: delta >= 0 ? 'rgba(45,212,160,0.08)' : 'rgba(255,186,8,0.08)',
              color: delta >= 0 ? color.emerald : color.warn,
            }}>
            {delta >= 0.05 ? <TrendingUp className="h-3 w-3" /> : delta <= -0.05 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs. season average
          </span>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-7 text-left">
        {metrics.map(m => (
          <div key={m.label}>
            <p style={{ ...BC, fontSize: '1.35rem', fontWeight: 800, color: color.ink }}>{m.value}</p>
            <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>{m.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5, ease }}
        className="text-left space-y-3">
        <div className="flex items-center gap-2.5 rounded-lg p-3.5" style={{ background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.16)' }}>
          <Sparkles className="h-4 w-4 shrink-0" style={{ color: color.ai }} aria-hidden />
          <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.5 }}>{observation}</p>
        </div>
        {best && (
          <div className="flex items-center gap-2.5 rounded-lg p-3.5" style={{ background: 'rgba(45,212,160,0.06)', border: '1px solid rgba(45,212,160,0.16)' }}>
            <TrendingUp className="h-4 w-4 shrink-0" style={{ color: color.emerald }} aria-hidden />
            <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.5 }}>
              <strong style={{ color: color.emerald }}>Biggest improvement:</strong> {best.label} vs. your last match.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2.5 rounded-lg p-3.5" style={{ background: 'rgba(255,90,60,0.06)', border: '1px solid rgba(255,90,60,0.16)' }}>
          <span style={{ ...BC, fontSize: '0.58rem', letterSpacing: '0.1em', color: color.accentSoft, fontWeight: 700 }} className="shrink-0">FOCUS</span>
          <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.5 }}>{focus}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }} className="mt-7">
        <CareerMessage message={messageDismissed ? null : careerMessage} onDismiss={() => setMessageDismissed(true)} />
      </motion.div>
    </div>
  )
}
