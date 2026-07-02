/* ═══ Scout Mode intelligence ═════════════════════════════════════════════
   Turns a lightweight, privacy-scoped match series into the evaluation
   surfaces a recruiter actually reads: a 6-category scorecard, a match
   shortlist, a position profile, and a DNA-evolution comparison. Every
   number here is derived directly from logged match fields — nothing is
   invented to make a section look fuller. */
import type { Match } from '@/types'
import { buildDNA, type DNAAttribute, type DNAKey } from './performanceIntel'
import { confidenceFromSample, type ConfidenceLevel } from './aiTrust'

const avg = (ns: number[]) => (ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : 0)
const std = (ns: number[]) => {
  if (ns.length < 2) return 0
  const m = avg(ns)
  return Math.sqrt(avg(ns.map(n => (n - m) ** 2)))
}
const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n))

/* ── Evaluation Scorecard ─────────────────────────────────────────────────── */
export type ScorecardKey = 'technical' | 'physical' | 'tactical' | 'mental' | 'consistency' | 'potential'

export interface EvaluationCategory {
  key: ScorecardKey
  label: string
  score: number
  trend: number
  confidence: ConfidenceLevel
  evidence: string
  direction: string
}

const byKey = (dna: DNAAttribute[]) => Object.fromEntries(dna.map(a => [a.key, a])) as Record<DNAKey, DNAAttribute>

export function buildScorecard(matches: Match[], dna: DNAAttribute[]): EvaluationCategory[] {
  const d = byKey(dna)
  const n = matches.length
  const ratings = matches.map(m => m.rating)
  const consistencyScore = clamp(100 - std(ratings) * 32)
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-5).map(m => m.rating)
  const prior = sorted.slice(0, Math.max(0, sorted.length - 5)).map(m => m.rating)
  const potentialTrend = prior.length ? avg(recent) - avg(prior) : 0
  const potentialScore = clamp(50 + potentialTrend * 25)

  const rows: { key: ScorecardKey; label: string; score: number; trend: number; evidence: string }[] = [
    {
      key: 'technical', label: 'Technical',
      score: (d.passing.value + d.finishing.value) / 2,
      trend: (d.passing.trend + d.finishing.trend) / 2,
      evidence: `${d.passing.value.toFixed(0)}/100 passing, ${d.finishing.value.toFixed(0)}/100 finishing across ${n} matches.`,
    },
    {
      key: 'physical', label: 'Physical',
      score: d.physical.value,
      trend: d.physical.trend,
      evidence: d.physical.explain,
    },
    {
      key: 'tactical', label: 'Tactical',
      score: (d.workRate.value + d.impact.value) / 2,
      trend: (d.workRate.trend + d.impact.trend) / 2,
      evidence: `Work rate ${d.workRate.value.toFixed(0)}/100, impact ${d.impact.value.toFixed(0)}/100 per 90 minutes.`,
    },
    {
      key: 'mental', label: 'Mental',
      score: d.composure.value,
      trend: d.composure.trend,
      evidence: d.composure.explain,
    },
    {
      key: 'consistency', label: 'Consistency',
      score: consistencyScore,
      trend: 0,
      evidence: consistencyScore >= 70
        ? `Rating varies by only ${std(ratings).toFixed(1)} points match to match — a dependable floor.`
        : `Rating swings by ${std(ratings).toFixed(1)} points match to match — performance is streakier than average.`,
    },
    {
      key: 'potential', label: 'Potential',
      score: potentialScore,
      trend: potentialTrend,
      evidence: prior.length
        ? `Last 5 matches average ${avg(recent).toFixed(1)} vs. ${avg(prior).toFixed(1)} prior — ${potentialTrend >= 0 ? 'trending up' : 'cooled off recently'}.`
        : 'Still establishing a trend line — more matches will sharpen this.',
    },
  ]

  return rows.map(r => ({
    ...r,
    score: Math.round(clamp(r.score)),
    confidence: confidenceFromSample(n, std(ratings) / 2.2),
    direction: r.trend > 0.5 ? 'Improving' : r.trend < -0.5 ? 'Declining' : 'Stable',
  }))
}

/* ── Match Shortlist ──────────────────────────────────────────────────────── */
export interface ShortlistEntry {
  label: string
  value: string
  match: { opponent: string; date: string; rating: number; goals: number; assists: number; passAccuracy: number }
}

export function buildMatchShortlist(matches: Match[]): ShortlistEntry[] {
  if (matches.length < 2) return []
  const seasonAvg = avg(matches.map(m => m.rating))
  const toEntry = (m: Match) => ({ opponent: m.opponent, date: m.date, rating: m.rating, goals: m.goals, assists: m.assists, passAccuracy: m.passAccuracy })

  const byRating = [...matches].sort((a, b) => b.rating - a.rating)[0]
  const mostConsistent = [...matches].filter(m => m.rating >= seasonAvg).sort((a, b) => Math.abs(a.rating - seasonAvg) - Math.abs(b.rating - seasonAvg))[0] ?? byRating
  const byPassing = [...matches].sort((a, b) => b.passAccuracy - a.passAccuracy)[0]
  const byComplete = [...matches].sort((a, b) =>
    (b.goals + b.assists + (b.tackles + b.interceptions) * 0.3 + b.passAccuracy / 25) -
    (a.goals + a.assists + (a.tackles + a.interceptions) * 0.3 + a.passAccuracy / 25))[0]
  const byImpact = [...matches].sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))[0]

  return [
    { label: 'Highest Rated', value: byRating.rating.toFixed(1), match: toEntry(byRating) },
    { label: 'Best Match', value: `${byImpact.goals}G ${byImpact.assists}A`, match: toEntry(byImpact) },
    { label: 'Most Consistent', value: mostConsistent.rating.toFixed(1), match: toEntry(mostConsistent) },
    { label: 'Best Passing', value: `${byPassing.passAccuracy}%`, match: toEntry(byPassing) },
    { label: 'Most Complete', value: byComplete.rating.toFixed(1), match: toEntry(byComplete) },
  ]
}

/* ── Position Profile ─────────────────────────────────────────────────────── */
export interface PositionProfileEntry {
  position: string
  matches: number
  avgRating: number
  pct: number
}

export function buildPositionProfile(matches: Match[]): PositionProfileEntry[] {
  const byPos = new Map<string, Match[]>()
  matches.forEach(m => byPos.set(m.position, [...(byPos.get(m.position) ?? []), m]))
  const total = matches.length
  return [...byPos.entries()]
    .map(([position, ms]) => ({ position, matches: ms.length, avgRating: avg(ms.map(m => m.rating)), pct: total ? Math.round((ms.length / total) * 100) : 0 }))
    .sort((a, b) => b.matches - a.matches)
}

/* ── DNA Evolution — early season vs. recent form ────────────────────────── */
export interface DNAEvolutionEntry {
  key: DNAKey
  label: string
  early: number
  recent: number
  delta: number
}

export function buildDNAEvolution(matches: Match[]): DNAEvolutionEntry[] {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 4) return []
  const mid = Math.floor(sorted.length / 2)
  const early = buildDNA(sorted.slice(0, mid))
  const recent = buildDNA(sorted.slice(mid))
  return early.map((e, i) => ({ key: e.key, label: e.label, early: e.value, recent: recent[i].value, delta: recent[i].value - e.value }))
}

/* ── Season Comparison ────────────────────────────────────────────────────── */
export interface ComparisonStats {
  label: string
  matches: number
  avgRating: number
  goals: number
  assists: number
  avgPassAccuracy: number
  winRate: number
}

export function buildComparisonStats(matches: Match[], label: string): ComparisonStats {
  const n = matches.length
  const wins = matches.filter(m => m.result === 'win').length
  return {
    label, matches: n,
    avgRating: avg(matches.map(m => m.rating)),
    goals: matches.reduce((s, m) => s + m.goals, 0),
    assists: matches.reduce((s, m) => s + m.assists, 0),
    avgPassAccuracy: Math.round(avg(matches.map(m => m.passAccuracy))),
    winRate: n ? Math.round((wins / n) * 100) : 0,
  }
}

/* ── Development Trajectory ───────────────────────────────────────────────── */
export type TrajectoryPhase = 'improving' | 'plateau' | 'breakthrough' | 'recovery' | 'decline'

export interface TrajectoryPoint {
  date: string
  opponent: string
  rating: number
  rollingAvg: number
  phase: TrajectoryPhase
}

export function buildTrajectory(matches: Match[]): TrajectoryPoint[] {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  const window = 3
  return sorted.map((m, i) => {
    const slice = sorted.slice(Math.max(0, i - window + 1), i + 1).map(x => x.rating)
    const rollingAvg = avg(slice)
    const priorSlice = sorted.slice(Math.max(0, i - window * 2), Math.max(0, i - window + 1)).map(x => x.rating)
    const priorAvg = priorSlice.length ? avg(priorSlice) : rollingAvg
    const delta = rollingAvg - priorAvg
    let phase: TrajectoryPhase = 'plateau'
    if (m.rating - rollingAvg >= 1.2) phase = 'breakthrough'
    else if (delta >= 0.4) phase = 'improving'
    else if (delta <= -0.6 && m.rating > rollingAvg) phase = 'recovery'
    else if (delta <= -0.4) phase = 'decline'
    return { date: m.date, opponent: m.opponent, rating: m.rating, rollingAvg, phase }
  })
}

export const PHASE_META: Record<TrajectoryPhase, { label: string; color: string }> = {
  improving: { label: 'Improving', color: '#2dd4a0' },
  plateau: { label: 'Plateau', color: '#9a97b8' },
  breakthrough: { label: 'Breakthrough', color: '#ff5a3c' },
  recovery: { label: 'Recovery', color: '#4d9fff' },
  decline: { label: 'Dip', color: '#ff4d5e' },
}
