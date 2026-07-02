/* ═══ AI Trust & Evidence Engine ═════════════════════════════════════════
   The rule governing every module in Performance Lab: if a claim can't be
   traced to a number in the athlete's own logged data, it doesn't get
   presented as fact. This file computes confidence, data coverage, and
   evidence structures that every module renders through the same UI
   primitives (EvidencePanel, ConfidenceBadge, DataCoverageCard). */
import type { Match } from '@/types'

export type ConfidenceLevel = 'very_high' | 'high' | 'moderate' | 'limited' | 'insufficient'

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  very_high: 'Very High Confidence',
  high: 'High Confidence',
  moderate: 'Moderate Confidence',
  limited: 'Limited Data',
  insufficient: 'Needs More Matches',
}

/* sample size + consistency (inverse of variance) drive confidence — never
   an arbitrary number, always a meaningful label */
export function confidenceFromSample(n: number, consistency?: number): ConfidenceLevel {
  if (n < 3) return 'insufficient'
  if (n < 6) return 'limited'
  if (n < 12) return consistency !== undefined && consistency < 0.4 ? 'moderate' : 'high'
  return consistency !== undefined && consistency < 0.4 ? 'moderate' : 'very_high'
}

export type RecommendationQuality = 'evidence_based' | 'trend_based' | 'early_pattern' | 'general_guidance' | 'limited_data'

export const QUALITY_LABEL: Record<RecommendationQuality, string> = {
  evidence_based: 'Evidence Based',
  trend_based: 'Trend Based',
  early_pattern: 'Early Pattern',
  general_guidance: 'General Coaching Guidance',
  limited_data: 'Limited Data',
}

export const QUALITY_COLOR: Record<RecommendationQuality, string> = {
  evidence_based: '#2dd4a0',
  trend_based: '#4d9fff',
  early_pattern: '#ffba08',
  general_guidance: '#9a97b8',
  limited_data: '#ff4d5e',
}

/* ── Evidence — what a module shows behind its "Why?" toggle ─────────────── */
export interface Evidence {
  primary: string[]
  supporting: string[]
  historicalContext: string[]
  confidence: ConfidenceLevel
  dataCoverage: string
  nextStep: string
}

/* ── Data Coverage — how complete the athlete's dataset is ───────────────── */
export interface DataCoverage {
  overall: 'excellent' | 'strong' | 'growing' | 'limited'
  categories: { key: string; label: string; pct: number; note: string }[]
}

export const COVERAGE_LABEL: Record<DataCoverage['overall'], string> = {
  excellent: 'Excellent Dataset',
  strong: 'Strong Dataset',
  growing: 'Growing Dataset',
  limited: 'Limited Dataset',
}

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n))

export function computeDataCoverage(matches: Match[]): DataCoverage {
  const n = matches.length
  const withSprint = matches.filter(m => m.sprintSpeed > 0).length
  const withReflection = matches.filter(m => m.reflection && Object.keys(m.reflection).length > 0).length
  const positions = new Set(matches.map(m => m.position)).size
  const competitions = new Set(matches.map(m => m.competition)).size

  const technical = clamp((n / 15) * 100)
  const physical = clamp(n > 0 ? (withSprint / n) * 100 : 0)
  const mental = clamp(n > 0 ? (withReflection / n) * 100 : 0)
  const recovery = clamp((withReflection / Math.max(n, 1)) * 60 + (n >= 8 ? 20 : 0))
  const positionDiversity = clamp((positions / 3) * 100)
  const seasonHistory = clamp((competitions / 3) * 60 + (n / 20) * 40)

  const categories = [
    { key: 'technical', label: 'Technical Metrics', pct: Math.round(technical), note: `${n} matches logged` },
    { key: 'physical', label: 'Physical Metrics', pct: Math.round(physical), note: `${withSprint}/${n} matches with sprint data` },
    { key: 'mental', label: 'Mental Reflections', pct: Math.round(mental), note: `${withReflection}/${n} matches reflected on` },
    { key: 'recovery', label: 'Recovery History', pct: Math.round(recovery), note: withReflection >= 3 ? 'Fatigue trend available' : 'Needs more reflections' },
    { key: 'position', label: 'Position Diversity', pct: Math.round(positionDiversity), note: `${positions} position${positions === 1 ? '' : 's'} logged` },
    { key: 'season', label: 'Season History', pct: Math.round(seasonHistory), note: `${competitions} competition${competitions === 1 ? '' : 's'}` },
  ]

  const avg = categories.reduce((s, c) => s + c.pct, 0) / categories.length
  const overall: DataCoverage['overall'] = avg >= 80 ? 'excellent' : avg >= 55 ? 'strong' : avg >= 30 ? 'growing' : 'limited'

  return { overall, categories }
}

/* ── Missing Data Assistant — encouraging, specific, never demanding ─────── */
export function missingDataTips(coverage: DataCoverage, matches: Match[]): string[] {
  const tips: string[] = []
  const byKey = Object.fromEntries(coverage.categories.map(c => [c.key, c])) as Record<string, DataCoverage['categories'][number]>

  if (byKey.physical.pct < 70) tips.push('Logging sprint speed after your next few matches will sharpen physical analysis.')
  if (byKey.mental.pct < 60) tips.push('Adding a Match Reflection after games will unlock mood and confidence trend insights.')
  if (byKey.position.pct < 60) tips.push('Recording your exact position every match will strengthen tactical recommendations.')
  if (matches.length < 10) tips.push(`Logging ${10 - matches.length} more match${10 - matches.length === 1 ? '' : 'es'} will move most modules from "Limited Data" to "High Confidence."`)
  return tips
}

/* ── AI transparency line — what the module is actually doing ───────────── */
export function transparencyLine(matches: Match[], scope: string): string {
  return `Analyzing ${matches.length} logged match${matches.length === 1 ? '' : 'es'}${scope ? ` — ${scope}` : ''}.`
}
