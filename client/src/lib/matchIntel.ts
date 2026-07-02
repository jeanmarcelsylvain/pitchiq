/* ═══ Match Journal intelligence ═══════════════════════════════════════════
   Per-match AI summary, season highlights, mood-history aggregation, and
   match-to-match comparison — all derived from real logged fields. Every
   sentence here should be traceable back to a number in the Match object. */
import type { Match } from '@/types'

const avg = (ns: number[]) => (ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : 0)

/* ── AI Match Summary — what went well, what declined, what to improve ──── */
export interface MatchSummary {
  wentWell: string[]
  declined: string[]
  improve: string
}

export function generateMatchSummary(match: Match, priorMatches: Match[]): MatchSummary {
  const baseline = priorMatches.length
    ? {
        rating: avg(priorMatches.map(m => m.rating)),
        passAcc: avg(priorMatches.map(m => m.passAccuracy)),
        distance: avg(priorMatches.map(m => m.distanceCovered)),
        sprint: avg(priorMatches.map(m => m.sprintSpeed)),
      }
    : null

  const wentWell: string[] = []
  const declined: string[] = []

  if (match.goals >= 2) wentWell.push(`${match.goals} goals — a multi-goal performance, well above a typical match.`)
  if (match.assists >= 2) wentWell.push(`${match.assists} assists — you were directly involved in the majority of the attack.`)
  if (baseline) {
    if (match.rating - baseline.rating >= 0.5) wentWell.push(`Rating of ${match.rating.toFixed(1)} is ${(match.rating - baseline.rating).toFixed(1)} above your recent average.`)
    if (match.passAccuracy - baseline.passAcc >= 6) wentWell.push(`${match.passAccuracy}% pass accuracy, ${(match.passAccuracy - baseline.passAcc).toFixed(0)} points above your recent average.`)
    if (match.sprintSpeed - baseline.sprint >= 1.5) wentWell.push(`Sprint speed of ${match.sprintSpeed} km/h outpaced your recent average by ${(match.sprintSpeed - baseline.sprint).toFixed(1)} km/h.`)
    if (match.rating - baseline.rating <= -0.5) declined.push(`Rating dropped ${Math.abs(match.rating - baseline.rating).toFixed(1)} points below your recent average.`)
    if (match.passAccuracy - baseline.passAcc <= -6) declined.push(`Pass accuracy fell ${(baseline.passAcc - match.passAccuracy).toFixed(0)} points below your recent average.`)
    if (match.distanceCovered - baseline.distance <= -1.5) declined.push(`Distance covered was ${(baseline.distance - match.distanceCovered).toFixed(1)} km below your recent average — possible fatigue or reduced involvement.`)
  }
  if (wentWell.length === 0) wentWell.push(`A steady, representative performance at ${match.position} across ${match.minutesPlayed} minutes.`)

  const improve = match.passAccuracy < 75
    ? 'Passing accuracy under pressure is the clearest lever for your next match.'
    : match.tackles + match.interceptions < 3 && ['CDM', 'CB', 'CM'].includes(match.position)
    ? 'Defensive involvement was light for this position — more proactive positioning could help.'
    : declined.length > 0
    ? 'Review what changed in preparation or role before your next match.'
    : 'Keep building on this level — consistency compounds faster than isolated peaks.'

  return { wentWell, declined, improve }
}

/* ── AI Highlights — season-wide superlatives ────────────────────────────── */
export interface Highlight {
  label: string
  match: Match
  value: string
}

export function buildHighlights(matches: Match[]): Highlight[] {
  if (matches.length < 2) return []
  const out: Highlight[] = []
  const byPass = [...matches].sort((a, b) => b.passAccuracy - a.passAccuracy)[0]
  const byDistance = [...matches].sort((a, b) => b.distanceCovered - a.distanceCovered)[0]
  const byRating = [...matches].sort((a, b) => b.rating - a.rating)[0]
  const byImpact = [...matches].sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))[0]

  out.push({ label: 'Best Passing', match: byPass, value: `${byPass.passAccuracy}%` })
  out.push({ label: 'Most Distance', match: byDistance, value: `${byDistance.distanceCovered} km` })
  out.push({ label: 'Highest Rating', match: byRating, value: byRating.rating.toFixed(1) })
  if (byImpact.goals + byImpact.assists > 0) {
    out.push({ label: 'Most Creative', match: byImpact, value: `${byImpact.goals}G ${byImpact.assists}A` })
  }
  return out
}

/* ── Mood History — from Phase 2C-1 reflections ──────────────────────────── */
export interface MoodPoint {
  date: string
  confidence?: number
  energy?: number
  focus?: number
  fatigue?: number
  enjoyment?: number
}

export function buildMoodHistory(matches: Match[]): MoodPoint[] {
  return [...matches]
    .filter(m => m.reflection)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({
      date: m.date,
      confidence: m.reflection?.confidence,
      energy: m.reflection?.energy,
      focus: m.reflection?.focus,
      fatigue: m.reflection?.fatigue,
      enjoyment: m.reflection?.enjoyment,
    }))
}

/* ── Match Comparison ─────────────────────────────────────────────────────── */
export interface ComparisonRow {
  label: string
  a: number | string
  b: number | string
  betterIsHigher: boolean
  delta: number | null
}

export function compareMatches(a: Match, b: Match): { rows: ComparisonRow[]; explanation: string } {
  const rows: ComparisonRow[] = [
    { label: 'Rating', a: a.rating, b: b.rating, betterIsHigher: true, delta: b.rating - a.rating },
    { label: 'Goals', a: a.goals, b: b.goals, betterIsHigher: true, delta: b.goals - a.goals },
    { label: 'Assists', a: a.assists, b: b.assists, betterIsHigher: true, delta: b.assists - a.assists },
    { label: 'Pass Accuracy', a: `${a.passAccuracy}%`, b: `${b.passAccuracy}%`, betterIsHigher: true, delta: b.passAccuracy - a.passAccuracy },
    { label: 'Distance', a: `${a.distanceCovered}km`, b: `${b.distanceCovered}km`, betterIsHigher: true, delta: b.distanceCovered - a.distanceCovered },
    { label: 'Sprint Speed', a: `${a.sprintSpeed}km/h`, b: `${b.sprintSpeed}km/h`, betterIsHigher: true, delta: b.sprintSpeed - a.sprintSpeed },
    { label: 'Minutes', a: a.minutesPlayed, b: b.minutesPlayed, betterIsHigher: true, delta: b.minutesPlayed - a.minutesPlayed },
  ]
  const ratingDelta = b.rating - a.rating
  const biggestSwing = [...rows].filter(r => r.label !== 'Rating' && r.delta !== null)
    .sort((x, y) => Math.abs(y.delta!) - Math.abs(x.delta!))[0]

  const explanation = Math.abs(ratingDelta) < 0.3
    ? `These two performances were close in rating (${a.rating.toFixed(1)} vs ${b.rating.toFixed(1)}) — the biggest individual swing was ${biggestSwing.label.toLowerCase()}.`
    : ratingDelta > 0
      ? `${b.opponent} rates ${ratingDelta.toFixed(1)} higher than ${a.opponent}, driven mainly by the gap in ${biggestSwing.label.toLowerCase()}.`
      : `${a.opponent} rates ${Math.abs(ratingDelta).toFixed(1)} higher than ${b.opponent}, driven mainly by the gap in ${biggestSwing.label.toLowerCase()}.`

  return { rows, explanation }
}

/* ── Milestone detection — for Career Message triggers ───────────────────── */
export function detectMilestone(matches: Match[]): { trigger: 'match_logged' | 'personal_record' | 'achievement_unlocked'; note: string } | null {
  const n = matches.length
  if (n === 10 || n === 25 || n === 50 || n === 100) {
    return { trigger: 'achievement_unlocked', note: `${n} matches completed.` }
  }
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const isHighestRating = latest && matches.every(m => m.rating <= latest.rating)
  if (isHighestRating && matches.length >= 3) {
    return { trigger: 'personal_record', note: 'Highest rating this season.' }
  }
  const last5 = sorted.slice(-5)
  const improving = last5.length === 5 && last5.every((m, i) => i === 0 || m.rating >= last5[i - 1].rating)
  if (improving) {
    return { trigger: 'achievement_unlocked', note: 'Five straight improvements.' }
  }
  return null
}
