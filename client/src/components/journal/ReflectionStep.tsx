/* ═══ Match Reflection ════════════════════════════════════════════════════
   Calm, optional, fast. Six 1-10 sliders, three chip questions, one
   optional text field. Nothing here is required to save the match. */
import { motion } from 'framer-motion'
import { color, font, ease } from '@/design/tokens'
import type { MatchReflection } from '@/types'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

const SLIDERS: { key: keyof MatchReflection; label: string }[] = [
  { key: 'confidence', label: 'Confidence' },
  { key: 'energy', label: 'Energy' },
  { key: 'focus', label: 'Focus' },
  { key: 'enjoyment', label: 'Enjoyment' },
  { key: 'fatigue', label: 'Physical Fatigue' },
  { key: 'mentalSharpness', label: 'Mental Sharpness' },
]

const CHIP_QUESTIONS: { key: keyof MatchReflection; question: string }[] = [
  { key: 'playedNaturalPosition', question: 'Did you play your natural position?' },
  { key: 'completedObjective', question: 'Did you complete your personal objective?' },
  { key: 'teamExecutedPlan', question: 'Did the team execute the game plan?' },
]

export function ReflectionStep({ reflection, onChange }: {
  reflection: MatchReflection; onChange: (r: MatchReflection) => void
}) {
  const set = <K extends keyof MatchReflection>(key: K, value: MatchReflection[K]) =>
    onChange({ ...reflection, [key]: value })

  return (
    <div>
      <p style={{ ...B, fontSize: '0.85rem', color: color.inkMuted, lineHeight: 1.6 }} className="mb-6 max-w-md">
        Every match teaches something. Capture how this one felt — it helps personalize your AI coaching and training recommendations. Everything here is optional.
      </p>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mb-7">
        {SLIDERS.map(({ key, label }) => {
          const val = (reflection[key] as number | undefined) ?? 5
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span style={{ ...B, fontSize: '0.8rem', color: color.inkDim, fontWeight: 500 }}>{label}</span>
                <span style={{ ...BC, fontSize: '0.85rem', color: color.accent, fontWeight: 700 }}>{val}</span>
              </div>
              <input
                type="range" min={1} max={10} value={val}
                onChange={e => set(key, Number(e.target.value))}
                aria-label={label}
                className="w-full"
                style={{ accentColor: color.accent }}
              />
            </div>
          )
        })}
      </div>

      <div className="space-y-3 mb-7">
        {CHIP_QUESTIONS.map(({ key, question }) => {
          const val = reflection[key] as boolean | undefined
          return (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg p-3"
              style={{ background: color.surface, border: `1px solid ${color.border}` }}>
              <span style={{ ...B, fontSize: '0.82rem', color: color.inkDim }}>{question}</span>
              <div className="flex gap-1.5 shrink-0">
                {([['Yes', true], ['No', false]] as const).map(([label, boolVal]) => (
                  <button key={label} type="button" onClick={() => set(key, boolVal)}
                    className="rounded-md px-3 py-1 text-xs font-semibold transition-colors"
                    style={{
                      ...BC,
                      background: val === boolVal ? color.accent : 'transparent',
                      color: val === boolVal ? color.bg : color.inkMuted,
                      border: `1px solid ${val === boolVal ? color.accent : color.border}`,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <label htmlFor="takeaway" style={{ ...B, fontSize: '0.8rem', color: color.inkDim, fontWeight: 500 }} className="block mb-1.5">
          One thing you learned today <span style={{ color: color.inkMuted }}>(optional)</span>
        </label>
        <textarea id="takeaway" rows={2}
          value={reflection.takeaway ?? ''}
          onChange={e => set('takeaway', e.target.value)}
          placeholder="What would you repeat next match? What do you want to improve?"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none transition-colors"
          style={{ ...B, color: color.ink, background: color.surface, border: `1px solid ${color.border}` }}
        />
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, ease }}
        style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }} className="mt-4">
        Reflections are one of several inputs used to personalize your AI Coach — never the only one, and never treated as more certain than your logged stats.
      </motion.p>
    </div>
  )
}
