/* ═══ Match Entry Flow ════════════════════════════════════════════════════
   Full guided journal entry (Match Info → Playing Info → Performance →
   Reflection → Summary) plus a Quick Log shortcut (5 fields, straight to
   save). Smart defaults pull from the athlete's most recent match. Drafts
   autosave to localStorage so nothing is ever lost mid-entry.

   Architecture note for future phases: `CUSTOM_METRIC_SLOT` in the
   Performance step is where coach/position/club-specific metrics would
   plug in — the step already renders from a data-driven metric list
   rather than hardcoded JSX, so adding a metric doesn't require touching
   layout. Video/wearable/GPS imports would populate `form` fields
   programmatically before the athlete ever sees Performance — the state
   shape doesn't change. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Sparkles, Zap, ListChecks } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { ProgressRing } from '@/components/widgets/Widget'
import { PositionSelector } from './PositionSelector'
import { ReflectionStep } from './ReflectionStep'
import { PostMatchSummary } from './PostMatchSummary'
import { getCareerMessage } from '@/lib/careerMessages'
import {
  Field, fieldStyle, ModalShell, ModalHeader as FlowHeader, ModalFooter as FlowFooter,
  PrimaryButton, SegmentedControl, NumberInput,
} from './JournalPrimitives'
import type { Match, MatchReflection, Position } from '@/types'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

type FormState = Omit<Match, 'id' | 'userId' | 'createdAt'>

const STEPS = ['Match Info', 'Playing Info', 'Performance', 'Reflection', 'Summary'] as const

function draftKey(uid: string) { return `journal_draft_${uid}` }

export function MatchEntryFlow({ uid, recentMatches, onClose, onSave, initialMode = 'full' }: {
  uid: string
  recentMatches: Match[]
  onClose: () => void
  onSave: (match: FormState, reflection: MatchReflection) => void
  initialMode?: 'quick' | 'full'
}) {
  const reduced = useReducedMotion()
  const lastMatch = recentMatches[0]

  const buildDefaults = (): FormState => ({
    date: new Date().toISOString().slice(0, 10),
    opponent: '',
    competition: lastMatch?.competition ?? '',
    venue: 'home',
    result: 'win',
    teamScore: 0,
    opponentScore: 0,
    position: lastMatch?.position ?? 'CM',
    minutesPlayed: lastMatch?.minutesPlayed ?? 90,
    goals: 0, assists: 0, shots: 0, shotsOnTarget: 0,
    passAccuracy: lastMatch ? Math.round(lastMatch.passAccuracy) : 80,
    tackles: 0, interceptions: 0,
    distanceCovered: lastMatch?.distanceCovered ?? 10,
    sprintSpeed: lastMatch?.sprintSpeed ?? 30,
    rating: 7,
    notes: '',
  })

  const [mode, setMode] = useState<'quick' | 'full'>(initialMode)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(buildDefaults)
  const [reflection, setReflection] = useState<MatchReflection>({})
  const [draftRestored, setDraftRestored] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedRef = useRef(false)

  /* restore draft once on mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(uid))
      if (raw) {
        const draft = JSON.parse(raw)
        if (draft.form) setForm(draft.form)
        if (draft.reflection) setReflection(draft.reflection)
        if (typeof draft.step === 'number') setStep(draft.step)
        setDraftRestored(true)
      }
    } catch { /* ignore corrupt draft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* autosave draft on every change, cleared on save */
  useEffect(() => {
    if (savedRef.current) return
    const t = setTimeout(() => {
      localStorage.setItem(draftKey(uid), JSON.stringify({ form, reflection, step }))
    }, 300)
    return () => clearTimeout(t)
  }, [form, reflection, step, uid])

  const field = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  /* ── soft validation — guidance, never harsh ─────────────────────────── */
  const opponentMissing = form.opponent.trim().length === 0
  const canContinueStep0 = !opponentMissing

  /* ── AI assist — one quiet, computed observation, never invented ─────── */
  const aiHint = useMemo(() => {
    if (recentMatches.length === 0) return null
    const avgSprint = recentMatches.reduce((s, m) => s + m.sprintSpeed, 0) / recentMatches.length
    const avgPass = recentMatches.reduce((s, m) => s + m.passAccuracy, 0) / recentMatches.length
    const monthAgo = Date.now() - 30 * 86400000
    const thisMonthMax = Math.max(0, ...recentMatches.filter(m => new Date(m.date).getTime() >= monthAgo).map(m => m.sprintSpeed))
    if (form.sprintSpeed > thisMonthMax && form.sprintSpeed > 0) return `${form.sprintSpeed} km/h would be your highest sprint speed this month.`
    if (form.passAccuracy >= avgPass + 8) return `${form.passAccuracy}% pass accuracy is well above your ${avgPass.toFixed(0)}% average.`
    if (form.sprintSpeed >= avgSprint + 2) return `That's faster than your usual ${avgSprint.toFixed(1)} km/h average sprint.`
    const posMatches = recentMatches.filter(m => m.position === form.position)
    if (posMatches.length >= 2 && form.position !== lastMatch?.position) return `You usually play ${lastMatch?.position} — ${form.position} is a change of pace.`
    return null
  }, [form.sprintSpeed, form.passAccuracy, form.position, recentMatches, lastMatch])

  /* ── live performance preview score (lightweight, not the full DNA engine) */
  const previewScore = Math.round(
    Math.min(100, Math.max(0,
      form.rating * 7 + Math.min(form.passAccuracy, 100) * 0.18 + Math.min(form.goals, 3) * 4 + Math.min(form.assists, 3) * 3
    ))
  )

  const seasonAvgBefore = recentMatches.length ? recentMatches.reduce((s, m) => s + m.rating, 0) / recentMatches.length : null

  const careerMessage = useMemo(() => {
    const sorted = [...recentMatches].sort((a, b) => b.date.localeCompare(a.date))
    const avg = seasonAvgBefore ?? form.rating
    let streak = form.rating >= avg ? 1 : 0
    for (const m of sorted) { if (m.rating >= avg) streak++; else break }
    const passingTrend4 = sorted.length >= 3 &&
      form.passAccuracy > sorted[0].passAccuracy && sorted[0].passAccuracy > sorted[1].passAccuracy && sorted[1].passAccuracy > sorted[2].passAccuracy
    return getCareerMessage('match_logged', { ratingStreak5: streak, passingTrend4 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved])

  const commitSave = () => {
    savedRef.current = true
    localStorage.removeItem(draftKey(uid))
    onSave(form, reflection)
    setSaved(true)
  }

  const goNext = () => setStep(s => Math.min(STEPS.length - 1, s + 1))
  const goBack = () => setStep(s => Math.max(0, s - 1))

  /* ── Quick Log — 5 fields, save immediately, no reflection ───────────── */
  if (mode === 'quick' && !saved) {
    return (
      <ModalShell onClose={onClose}>
        <FlowHeader title="Quick Log" subtitle="The essentials — you can fill in the rest later." onClose={onClose} />
        <div className="p-6 space-y-5">
          <PositionSelector value={form.position} onChange={p => field('position', p)} suggested={lastMatch?.position} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Goals"><NumberInput value={form.goals} onChange={v => field('goals', v)} /></Field>
            <Field label="Assists"><NumberInput value={form.assists} onChange={v => field('assists', v)} /></Field>
            <Field label="Minutes Played"><NumberInput value={form.minutesPlayed} onChange={v => field('minutesPlayed', v)} max={120} /></Field>
            <Field label="Match Rating (1–10)"><NumberInput value={form.rating} onChange={v => field('rating', v)} max={10} step={0.5} /></Field>
          </div>
          <button onClick={() => setMode('full')} className="text-xs underline transition-colors" style={{ ...B, color: color.inkMuted }}>
            Switch to full Match Journal entry
          </button>
        </div>
        <FlowFooter>
          <div />
          <PrimaryButton onClick={commitSave}><Zap className="h-4 w-4" /> Save Quick Entry</PrimaryButton>
        </FlowFooter>
      </ModalShell>
    )
  }

  /* ── Save confirmation (both modes land here) ─────────────────────────── */
  if (saved) {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-6 sm:p-8">
          <PostMatchSummary
            match={form}
            seasonAvgBefore={seasonAvgBefore}
            priorMatch={lastMatch ?? null}
            performanceScore={previewScore}
            careerMessage={careerMessage}
          />
          <div className="mt-8 flex justify-center">
            <PrimaryButton onClick={onClose}><Check className="h-4 w-4" /> Back to Player HQ</PrimaryButton>
          </div>
        </div>
      </ModalShell>
    )
  }

  /* ── Full guided flow ──────────────────────────────────────────────────── */
  return (
    <ModalShell onClose={onClose}>
      <FlowHeader title="Match Journal Entry" subtitle="Document your journey — this takes under a minute." onClose={onClose}>
        <button onClick={() => setMode('quick')}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors shrink-0"
          style={{ ...BC, color: color.ai, border: `1px solid rgba(77,159,255,0.3)`, background: 'rgba(77,159,255,0.06)' }}>
          <Zap className="h-3 w-3" /> Quick Log
        </button>
      </FlowHeader>

      {/* progress */}
      <div className="px-6 pt-4 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(37,43,77,0.7)' }}>
              <motion.div className="h-full rounded-full" style={{ background: color.accent }}
                initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.4, ease }} />
            </div>
            <p style={{ ...BC, fontSize: '0.58rem', letterSpacing: '0.06em', color: i === step ? color.accent : color.inkMuted }} className="mt-1.5 hidden sm:block">
              {label}
            </p>
          </div>
        ))}
      </div>

      {draftRestored && step === 0 && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-md px-3 py-2" style={{ background: 'rgba(255,186,8,0.06)', border: '1px solid rgba(255,186,8,0.18)' }}>
          <ListChecks className="h-3.5 w-3.5 shrink-0" style={{ color: color.warn }} />
          <p style={{ ...B, fontSize: '0.72rem', color: color.inkDim }}>Draft restored from your last session.</p>
        </div>
      )}

      <div className="p-6 min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease }}
          >
            {step === 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Opponent" hint={opponentMissing ? 'Just a name — you can always edit it later.' : undefined}>
                  <input style={fieldStyle()} placeholder="e.g. Riverview FC" value={form.opponent} onChange={e => field('opponent', e.target.value)} autoFocus />
                </Field>
                <Field label="Competition">
                  <input style={fieldStyle()} placeholder="e.g. ECNL Regional" value={form.competition} onChange={e => field('competition', e.target.value)} />
                </Field>
                <Field label="Date">
                  <input type="date" style={fieldStyle()} value={form.date} onChange={e => field('date', e.target.value)} />
                </Field>
                <Field label="Home / Away">
                  <SegmentedControl value={form.venue} onChange={v => field('venue', v as FormState['venue'])}
                    options={[['home', 'Home'], ['away', 'Away'], ['neutral', 'Neutral']]} />
                </Field>
                <Field label="Result">
                  <SegmentedControl value={form.result ?? 'win'} onChange={v => field('result', v as FormState['result'])}
                    options={[['win', 'Win'], ['draw', 'Draw'], ['loss', 'Loss']]} />
                </Field>
                <Field label="Score (You – Opponent)">
                  <div className="flex items-center gap-2">
                    <NumberInput value={form.teamScore ?? 0} onChange={v => field('teamScore', v)} />
                    <span style={{ color: color.inkMuted }}>–</span>
                    <NumberInput value={form.opponentScore ?? 0} onChange={v => field('opponentScore', v)} />
                  </div>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-6 items-start">
                <PositionSelector value={form.position} onChange={p => field('position', p)} suggested={lastMatch?.position} />
                <div className="space-y-4">
                  <Field label="Minutes Played">
                    <NumberInput value={form.minutesPlayed} onChange={v => field('minutesPlayed', v)} max={120} />
                  </Field>
                  <Field label="Starting or Substitute">
                    <SegmentedControl value={form.minutesPlayed >= 60 ? 'start' : 'sub'} onChange={v => field('minutesPlayed', v === 'start' ? 90 : 25)}
                      options={[['start', 'Starting XI'], ['sub', 'Substitute']]} />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <PerformanceStep form={form} field={field} previewScore={previewScore} aiHint={aiHint} />
            )}

            {step === 3 && (
              <ReflectionStep reflection={reflection} onChange={setReflection} />
            )}

            {step === 4 && (
              <PostMatchSummary
                match={form}
                seasonAvgBefore={seasonAvgBefore}
                priorMatch={lastMatch ?? null}
                performanceScore={previewScore}
                careerMessage={careerMessage}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <FlowFooter>
        {step > 0 ? (
          <button onClick={goBack} className="flex items-center gap-1 text-sm transition-colors" style={{ ...B, color: color.inkMuted }}>
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : <div />}
        {step < STEPS.length - 1 ? (
          <PrimaryButton onClick={goNext} disabled={step === 0 && !canContinueStep0}>
            Continue <ChevronRight className="h-4 w-4" />
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={commitSave}><Check className="h-4 w-4" /> Save to Journal</PrimaryButton>
        )}
      </FlowFooter>
    </ModalShell>
  )
}

/* ── Performance step — form fields + live summary + AI hint ────────────── */
function PerformanceStep({ form, field, previewScore, aiHint }: {
  form: FormState; field: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  previewScore: number; aiHint: string | null
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_240px] gap-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Goals"><NumberInput value={form.goals} onChange={v => field('goals', v)} /></Field>
        <Field label="Assists"><NumberInput value={form.assists} onChange={v => field('assists', v)} /></Field>
        <Field label="Shots"><NumberInput value={form.shots} onChange={v => field('shots', v)} /></Field>
        <Field label="Shots on Target"><NumberInput value={form.shotsOnTarget} onChange={v => field('shotsOnTarget', v)} /></Field>
        <Field label="Pass Accuracy %"><NumberInput value={form.passAccuracy} onChange={v => field('passAccuracy', v)} max={100} /></Field>
        <Field label="Tackles"><NumberInput value={form.tackles} onChange={v => field('tackles', v)} /></Field>
        <Field label="Interceptions"><NumberInput value={form.interceptions} onChange={v => field('interceptions', v)} /></Field>
        <Field label="Distance (km)"><NumberInput value={form.distanceCovered} onChange={v => field('distanceCovered', v)} step={0.1} /></Field>
        <Field label="Sprint Speed (km/h)"><NumberInput value={form.sprintSpeed} onChange={v => field('sprintSpeed', v)} step={0.1} /></Field>
        <Field label="Match Rating (1–10)"><NumberInput value={form.rating} onChange={v => field('rating', v)} max={10} step={0.5} /></Field>
      </div>

      {/* live summary */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
        <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.14em', color: color.inkMuted, fontWeight: 700 }}>LIVE SUMMARY</p>
        <div className="flex justify-center">
          <ProgressRing value={previewScore} max={100} size={92} stroke={5}
            label={<span style={{ ...BC, fontSize: '1.5rem', fontWeight: 800, color: color.ink }}>{previewScore}</span>}
            sub="preview" />
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          {[['Goals', form.goals], ['Assists', form.assists], ['Distance', `${form.distanceCovered}km`], ['Pass %', `${form.passAccuracy}%`]].map(([l, v]) => (
            <div key={l as string}>
              <p style={{ ...MONO, fontSize: '0.9rem', color: color.ink }}>{v}</p>
              <p style={{ ...B, fontSize: '0.6rem', color: color.inkMuted }}>{l}</p>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {aiHint && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.16)' }}>
              <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: color.ai }} />
              <p style={{ ...B, fontSize: '0.7rem', color: color.inkDim, lineHeight: 1.4 }}>{aiHint}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

