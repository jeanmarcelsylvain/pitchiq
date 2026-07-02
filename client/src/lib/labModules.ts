/* ═══ Performance Lab modules ═════════════════════════════════════════════
   Tactical Analyst, Recovery Advisor, Season Review, Match Breakdown, and
   Future Projection — each built on the existing performanceIntel /
   matchIntel engines, wrapped in evidence + confidence so every module
   speaks the same trust language. */
import type { Match } from '@/types'
import type { Evidence, ConfidenceLevel, RecommendationQuality } from './aiTrust'
import { confidenceFromSample } from './aiTrust'
import { buildDNA, detectPatterns, projectDevelopment, buildMomentum, buildPersonalRecords, type DNAAttribute } from './performanceIntel'
import { generateMatchSummary, buildHighlights } from './matchIntel'

const avg = (ns: number[]) => (ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : 0)

function qualityFor(confidence: ConfidenceLevel): RecommendationQuality {
  if (confidence === 'very_high' || confidence === 'high') return 'evidence_based'
  if (confidence === 'moderate') return 'trend_based'
  if (confidence === 'limited') return 'early_pattern'
  return 'limited_data'
}

/* ── Tactical Analyst ─────────────────────────────────────────────────────── */
export interface TacticalInsight {
  title: string
  body: string
  quality: RecommendationQuality
  evidence: Evidence
}

export function buildTacticalAnalysis(matches: Match[]): TacticalInsight[] {
  const patterns = detectPatterns(matches)
  return patterns.map(p => {
    const confidence = confidenceFromSample(matches.length, undefined)
    return {
      title: p.title,
      body: p.body,
      quality: qualityFor(confidence),
      evidence: {
        primary: [p.body],
        supporting: [`${p.a.label}: ${p.a.value.toFixed(1)}  vs.  ${p.b.label}: ${p.b.value.toFixed(1)}`],
        historicalContext: [`Pattern detected across ${matches.length} logged matches.`],
        confidence,
        dataCoverage: `${matches.length} matches analyzed`,
        nextStep: p.action,
      },
    }
  })
}

/* ── Recovery Advisor ─────────────────────────────────────────────────────── */
export interface RecoveryAdvice {
  recommendation: string
  rationale: string
  isGeneralGuidance: boolean
  quality: RecommendationQuality
  evidence: Evidence
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function buildRecoveryAdvice(matches: Match[]): RecoveryAdvice {
  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date))
  const last = sorted[0]
  if (!last) {
    return {
      recommendation: 'Log your first match to unlock personalized recovery guidance.',
      rationale: 'No matches logged yet.',
      isGeneralGuidance: true, quality: 'limited_data',
      evidence: { primary: [], supporting: [], historicalContext: [], confidence: 'insufficient', dataCoverage: '0 matches', nextStep: 'Log a match to begin.' },
    }
  }

  const recentFatigue = sorted.slice(0, 3).map(m => m.reflection?.fatigue).filter((v): v is number => v !== undefined)
  const daysSince = daysBetween(last.date, new Date().toISOString().slice(0, 10))
  const threeInEight = sorted.filter(m => Math.abs(daysBetween(m.date, last.date)) <= 8).length >= 3

  const withRest = matches.length >= 5
    ? (() => {
        const gaps: { rest: number; rating: number }[] = []
        const asc = [...matches].sort((a, b) => a.date.localeCompare(b.date))
        for (let i = 1; i < asc.length; i++) gaps.push({ rest: daysBetween(asc[i - 1].date, asc[i].date), rating: asc[i].rating })
        const short = gaps.filter(g => g.rest <= 3).map(g => g.rating)
        const long = gaps.filter(g => g.rest > 3).map(g => g.rating)
        return short.length >= 2 && long.length >= 2 ? { short: avg(short), long: avg(long) } : null
      })()
    : null

  let recommendation: string
  let rationale: string
  let isGeneralGuidance = false

  if (recentFatigue.length > 0 && avg(recentFatigue) >= 7) {
    recommendation = 'Prioritize a full rest day — light mobility only, no high-intensity training.'
    rationale = `Your last ${recentFatigue.length} reflection${recentFatigue.length === 1 ? '' : 's'} show elevated fatigue (avg ${avg(recentFatigue).toFixed(1)}/10).`
  } else if (threeInEight) {
    recommendation = 'Schedule active recovery — mobility and light technical work, not full-intensity training.'
    rationale = `You've played ${sorted.filter(m => Math.abs(daysBetween(m.date, last.date)) <= 8).length} matches within 8 days.`
  } else if (withRest && withRest.long - withRest.short >= 0.3) {
    recommendation = `Protect at least 4 days of recovery before your next match — your rating averages ${withRest.long.toFixed(1)} with proper rest vs. ${withRest.short.toFixed(1)} on short turnarounds.`
    rationale = 'Based on your own rest-vs-rating history.'
  } else {
    recommendation = 'Standard recovery protocol: light stretching, hydration, and 8+ hours of sleep before your next session.'
    rationale = 'General post-match recovery guidance — not yet enough data to personalize this further.'
    isGeneralGuidance = true
  }

  const confidence: ConfidenceLevel = isGeneralGuidance ? 'insufficient' : confidenceFromSample(matches.length)

  return {
    recommendation, rationale, isGeneralGuidance,
    quality: isGeneralGuidance ? 'general_guidance' : qualityFor(confidence),
    evidence: {
      primary: [rationale],
      supporting: recentFatigue.length > 0 ? [`Recent fatigue reflections: ${recentFatigue.join(', ')}/10`] : [],
      historicalContext: withRest ? [`Rating with 4+ days rest: ${withRest.long.toFixed(1)} · with ≤3 days: ${withRest.short.toFixed(1)}`] : [],
      confidence,
      dataCoverage: `${matches.length} matches, ${recentFatigue.length} recent fatigue reflections`,
      nextStep: isGeneralGuidance ? 'Add Match Reflections to personalize recovery guidance.' : 'Log your next match to confirm this pattern holds.',
    },
  }
}

/* ── Match Breakdown (Evidence-wrapped) ───────────────────────────────────── */
export function buildMatchBreakdownEvidence(match: Match, priorMatches: Match[]): Evidence {
  const summary = generateMatchSummary(match, priorMatches)
  const confidence = confidenceFromSample(priorMatches.length + 1)
  return {
    primary: summary.wentWell,
    supporting: summary.declined,
    historicalContext: priorMatches.length > 0 ? [`Compared against your prior ${priorMatches.length} matches.`] : ['This is your first logged match — no history to compare against yet.'],
    confidence,
    dataCoverage: `1 match + ${priorMatches.length} prior for context`,
    nextStep: summary.improve,
  }
}

/* ── Season Review ────────────────────────────────────────────────────────── */
export interface SeasonReview {
  matchCount: number
  avgRating: number
  bestPerformance: Match | null
  consistency: number
  dna: DNAAttribute[]
  biggestImprovement: DNAAttribute | null
  needsWork: DNAAttribute | null
  records: ReturnType<typeof buildPersonalRecords>
  highlights: ReturnType<typeof buildHighlights>
  momentum: ReturnType<typeof buildMomentum>
}

export function buildSeasonReview(matches: Match[]): SeasonReview {
  const dna = buildDNA(matches)
  const sorted = [...dna].sort((a, b) => b.trend - a.trend)
  const byRating = [...matches].sort((a, b) => b.rating - a.rating)
  const consistency = dna.find(a => a.key === 'composure')?.value ?? 0

  return {
    matchCount: matches.length,
    avgRating: avg(matches.map(m => m.rating)),
    bestPerformance: byRating[0] ?? null,
    consistency,
    dna,
    biggestImprovement: sorted[0] ?? null,
    needsWork: [...dna].sort((a, b) => a.value - b.value)[0] ?? null,
    records: buildPersonalRecords(matches),
    highlights: buildHighlights(matches),
    momentum: buildMomentum(matches),
  }
}

/* ── Future Projection (evidence-wrapped) ─────────────────────────────────── */
export function buildProjectionEvidence(dna: DNAAttribute[], matches: Match[]) {
  const projections = projectDevelopment(dna)
  return projections.map(p => ({
    ...p,
    evidence: {
      primary: [p.driver],
      supporting: [`Current: ${p.current.toFixed(0)} → Projected: ${p.projected.toFixed(0)} (range ${p.low.toFixed(0)}–${p.high.toFixed(0)})`],
      historicalContext: [`Extrapolated from your last 5 matches vs. season baseline.`],
      confidence: confidenceFromSample(matches.length),
      dataCoverage: `${matches.length} matches`,
      nextStep: 'Keep logging matches — projections tighten as more data comes in.',
    } as Evidence,
  }))
}
