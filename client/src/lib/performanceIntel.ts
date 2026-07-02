/* ═══ Performance Intelligence engine ════════════════════════════════════════
   Every number on the Performance Intel page traces back to this file. No
   attribute is displayed unless it's derived from real logged match fields —
   there's no "Vision" or "Leadership" score here, because nothing in the
   Match schema measures those. What we do measure, we measure honestly. */
import type { Match, Position } from '@/types'

export type DNAKey = 'passing' | 'finishing' | 'defending' | 'physical' | 'workRate' | 'composure' | 'impact'

export interface DNAAttribute {
  key: DNAKey
  label: string
  value: number          // 0–100
  trend: number           // last-5 vs season-prior delta, in points
  matches: number         // sample size backing this attribute
  explain: string
  improve: string
}

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n))
const avg = (ns: number[]) => (ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : 0)
const std = (ns: number[]) => {
  if (ns.length < 2) return 0
  const m = avg(ns)
  return Math.sqrt(avg(ns.map(n => (n - m) ** 2)))
}

/* per-90 normalization so a 60-minute sub isn't penalized like a bad 90 */
const per90 = (total: number, minutes: number) => (minutes > 0 ? (total / minutes) * 90 : 0)

function scoreFor(key: DNAKey, ms: Match[]): number {
  if (ms.length === 0) return 0
  switch (key) {
    case 'passing':
      return clamp(avg(ms.map(m => m.passAccuracy)))
    case 'finishing': {
      const shots = ms.reduce((s, m) => s + m.shots, 0)
      const goals = ms.reduce((s, m) => s + m.goals, 0)
      const onTarget = ms.reduce((s, m) => s + m.shotsOnTarget, 0)
      const conv = shots > 0 ? goals / shots : 0
      const accuracy = shots > 0 ? onTarget / shots : 0
      return clamp((conv * 220 + accuracy * 55))
    }
    case 'defending': {
      const rate = avg(ms.map(m => per90(m.tackles + m.interceptions, m.minutesPlayed)))
      return clamp((rate / 6) * 100)
    }
    case 'physical':
      return clamp((avg(ms.map(m => m.sprintSpeed)) / 33) * 100)
    case 'workRate':
      return clamp((avg(ms.map(m => per90(m.distanceCovered, m.minutesPlayed))) / 12.5) * 100)
    case 'composure': {
      const ratings = ms.map(m => m.rating)
      return clamp(100 - std(ratings) * 32)
    }
    case 'impact':
      return clamp((avg(ms.map(m => per90(m.goals + m.assists, m.minutesPlayed))) / 2.6) * 100)
  }
}

const EXPLAIN: Record<DNAKey, (v: number, ms: Match[]) => string> = {
  passing: (v, ms) => `${v.toFixed(0)}% completion across ${ms.length} matches — the platform every other number sits on.`,
  finishing: (v) => v >= 70
    ? 'You convert shots at an elite rate relative to volume — composure in the box shows up in the numbers.'
    : 'Shot conversion is the gap between chances created and goals scored — more shots aren\'t needed, better ones are.',
  defending: (v) => v >= 60
    ? 'Tackles and interceptions per 90 put you well above a passive off-ball profile.'
    : 'Defensive actions per 90 are light — this may simply reflect your role, not a weakness.',
  physical: (v) => `Top sprint speed sits at ${v.toFixed(0)}% of an elite reference ceiling (33 km/h) across logged matches.`,
  workRate: (v) => `Distance covered per 90 minutes, normalized — ${v >= 70 ? 'you\'re consistently in the top gear of your matches' : 'there\'s a clear runway to raise your work rate per 90'}.`,
  composure: (v) => v >= 70
    ? 'Low variance in match rating — you perform close to your ceiling whether the match is easy or hard.'
    : 'Rating swings more than it should match to match — the talent shows in flashes rather than every week.',
  impact: (v) => `Goals + assists per 90, normalized — ${v >= 65 ? 'you directly decide matches at a high rate' : 'end product is the clearest lever left to pull'}.`,
}

const IMPROVE: Record<DNAKey, string> = {
  passing: 'Shorten your average pass distance under pressure — accuracy climbs fastest in tight spaces first.',
  finishing: 'Log shot placement on your next 5 attempts — most conversion gaps are a technique pattern, not luck.',
  defending: 'Track anticipation vs. recovery tackles — anticipated actions cost less energy and less foul risk.',
  physical: 'Add one weekly interval session at 90%+ effort — sprint ceiling responds fastest to top-speed work, not volume.',
  workRate: 'Build a pre-match activation routine — most work-rate drop-off happens in the first 15 minutes, not the last.',
  composure: 'Review your two lowest-rated matches for a shared trigger (fatigue, position, opponent press) before your next one.',
  impact: 'Ask for minutes in the position where your per-90 output already peaks — role fit multiplies output.',
}

export const DNA_LABELS: Record<DNAKey, string> = {
  passing: 'Passing', finishing: 'Finishing', defending: 'Defending',
  physical: 'Physical', workRate: 'Work Rate', composure: 'Composure', impact: 'Impact',
}

export function buildDNA(matches: Match[]): DNAAttribute[] {
  const keys: DNAKey[] = ['passing', 'finishing', 'defending', 'physical', 'workRate', 'composure', 'impact']
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-5)
  const prior = sorted.slice(0, Math.max(0, sorted.length - 5))
  return keys.map(key => {
    const value = scoreFor(key, matches)
    const recentScore = recent.length ? scoreFor(key, recent) : value
    const priorScore = prior.length ? scoreFor(key, prior) : value
    return {
      key,
      label: DNA_LABELS[key],
      value,
      trend: prior.length ? recentScore - priorScore : 0,
      matches: matches.length,
      explain: EXPLAIN[key](value, matches),
      improve: IMPROVE[key],
    }
  })
}

/* ── Playing Style Engine ─────────────────────────────────────────────────── */

export interface PlayingStyle {
  label: string
  confidence: number
  evidence: string[]
  evolving: string
}

const FORWARD: Position[] = ['ST', 'CF']
const WIDE: Position[] = ['LW', 'RW', 'LM', 'RM']
const CENTRAL_MID: Position[] = ['CM', 'CAM', 'CDM']
const BACK: Position[] = ['CB', 'LB', 'RB']

export function classifyStyle(matches: Match[], dna: DNAAttribute[]): PlayingStyle | null {
  if (matches.length < 2) return null
  const byKey = Object.fromEntries(dna.map(a => [a.key, a.value])) as Record<DNAKey, number>
  const posCounts = new Map<Position, number>()
  matches.forEach(m => posCounts.set(m.position, (posCounts.get(m.position) ?? 0) + 1))
  const primaryPos = [...posCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]

  const candidates: { label: string; score: number; evidence: string[] }[] = []

  if (FORWARD.includes(primaryPos) && byKey.finishing >= 55) {
    candidates.push({
      label: 'Clinical Finisher',
      score: byKey.finishing * 0.7 + byKey.impact * 0.3,
      evidence: [`Finishing score of ${byKey.finishing.toFixed(0)}/100 at ${primaryPos}`, `${byKey.impact.toFixed(0)}/100 impact per 90 minutes`],
    })
  }
  if (CENTRAL_MID.includes(primaryPos) && byKey.passing >= 60 && byKey.impact >= 45) {
    candidates.push({
      label: 'Creative Playmaker',
      score: byKey.passing * 0.5 + byKey.impact * 0.5,
      evidence: [`${byKey.passing.toFixed(0)}% pass completion from midfield`, `Impact score ${byKey.impact.toFixed(0)}/100`],
    })
  }
  if (CENTRAL_MID.includes(primaryPos) && byKey.passing >= 55 && byKey.defending < 45) {
    candidates.push({
      label: 'Deep Playmaker',
      score: byKey.passing * 0.65 + (100 - byKey.defending) * 0.15,
      evidence: [`High-volume passing (${byKey.passing.toFixed(0)}%) with light defensive load`, 'Profile skews toward build-up over recovery'],
    })
  }
  if (CENTRAL_MID.includes(primaryPos) && byKey.workRate >= 60 && byKey.defending >= 45) {
    candidates.push({
      label: 'Box-to-Box Engine',
      score: byKey.workRate * 0.5 + byKey.defending * 0.35,
      evidence: [`Work rate ${byKey.workRate.toFixed(0)}/100 per 90`, `Defensive actions score ${byKey.defending.toFixed(0)}/100`],
    })
  }
  if (BACK.includes(primaryPos) && byKey.defending >= 45) {
    candidates.push({
      label: 'Defensive Anchor',
      score: byKey.defending * 0.7 + byKey.composure * 0.3,
      evidence: [`Defending score ${byKey.defending.toFixed(0)}/100 at ${primaryPos}`, `Composure ${byKey.composure.toFixed(0)}/100 under pressure`],
    })
  }
  if (WIDE.includes(primaryPos) && byKey.impact >= 40) {
    candidates.push({
      label: 'Wide Creator',
      score: byKey.impact * 0.55 + byKey.physical * 0.25,
      evidence: [`${primaryPos} with ${byKey.impact.toFixed(0)}/100 impact score`, `Physical profile ${byKey.physical.toFixed(0)}/100`],
    })
  }
  if (byKey.passing >= 50 && byKey.defending >= 40 && byKey.finishing >= 40) {
    candidates.push({
      label: 'Complete Player',
      score: (byKey.passing + byKey.defending + byKey.finishing + byKey.physical) / 4,
      evidence: ['No single weakness across passing, defending, finishing or physical output', 'Balanced profile across every measured dimension'],
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  const top = candidates[0]
  if (!top) return null

  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-5)
  const prior = sorted.slice(0, Math.max(0, sorted.length - 5))
  const recentAvg = avg(recent.map(m => m.rating))
  const priorAvg = prior.length ? avg(prior.map(m => m.rating)) : recentAvg
  const delta = recentAvg - priorAvg

  return {
    label: top.label,
    confidence: Math.min(96, 48 + matches.length * 4),
    evidence: top.evidence,
    evolving: prior.length
      ? delta >= 0.15
        ? `This identity has strengthened over your last ${recent.length} matches — rating up ${delta.toFixed(1)} vs. the prior stretch.`
        : delta <= -0.15
          ? `This identity has softened slightly — rating down ${Math.abs(delta).toFixed(1)} vs. the prior stretch. Worth watching.`
          : 'This identity has held steady across your recent matches.'
      : 'Still establishing a baseline — log more matches to track how this evolves.',
  }
}

/* ── AI Pattern Detection ─────────────────────────────────────────────────── */

export interface PatternInsight {
  id: string
  title: string
  body: string
  action: string
  confidence: number
  a: { label: string; value: number }
  b: { label: string; value: number }
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function detectPatterns(matches: Match[]): PatternInsight[] {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  const out: PatternInsight[] = []
  if (sorted.length < 3) return out

  /* rest days vs. rating */
  const withRest: { rest: number; rating: number }[] = []
  for (let i = 1; i < sorted.length; i++) {
    withRest.push({ rest: daysBetween(sorted[i - 1].date, sorted[i].date), rating: sorted[i].rating })
  }
  const shortRest = withRest.filter(w => w.rest <= 3).map(w => w.rating)
  const longRest = withRest.filter(w => w.rest > 3).map(w => w.rating)
  if (shortRest.length >= 2 && longRest.length >= 2) {
    const diff = avg(longRest) - avg(shortRest)
    if (Math.abs(diff) >= 0.2) {
      out.push({
        id: 'rest',
        title: diff > 0 ? 'Recovery time correlates with rating' : 'Short rest hasn\'t hurt your output',
        body: diff > 0
          ? `You average ${avg(longRest).toFixed(1)} with 4+ days of rest vs. ${avg(shortRest).toFixed(1)} on 3 or fewer — a ${diff.toFixed(1)}-point gap.`
          : `Your rating on short rest (${avg(shortRest).toFixed(1)}) actually holds up against longer rest (${avg(longRest).toFixed(1)}) — fitness base is carrying you.`,
        action: diff > 0 ? 'Protect at least 3 recovery days before matches that matter most.' : 'Keep the current recovery routine — it\'s working.',
        confidence: Math.min(90, 45 + withRest.length * 4),
        a: { label: '≤3 days rest', value: avg(shortRest) },
        b: { label: '4+ days rest', value: avg(longRest) },
      })
    }
  }

  /* venue vs rating */
  const home = matches.filter(m => m.venue === 'home').map(m => m.rating)
  const away = matches.filter(m => m.venue === 'away').map(m => m.rating)
  if (home.length >= 2 && away.length >= 2) {
    const diff = avg(home) - avg(away)
    if (Math.abs(diff) >= 0.2) {
      out.push({
        id: 'venue',
        title: diff > 0 ? 'Home advantage shows in your numbers' : 'You perform better on the road',
        body: `${diff > 0 ? 'Home' : 'Away'} average rating is ${Math.max(avg(home), avg(away)).toFixed(1)}, vs. ${Math.min(avg(home), avg(away)).toFixed(1)} ${diff > 0 ? 'away' : 'at home'} — a ${Math.abs(diff).toFixed(1)}-point swing.`,
        action: diff > 0 ? 'Build a repeatable away-day routine to close the gap.' : 'Whatever your away-day mentality is, it\'s an asset — protect it.',
        confidence: Math.min(88, 42 + (home.length + away.length) * 3),
        a: { label: 'Home', value: avg(home) },
        b: { label: 'Away', value: avg(away) },
      })
    }
  }

  /* best position by rating */
  const byPos = new Map<Position, number[]>()
  matches.forEach(m => byPos.set(m.position, [...(byPos.get(m.position) ?? []), m.rating]))
  const posEntries = [...byPos.entries()].filter(([, r]) => r.length >= 2).sort((a, b) => avg(b[1]) - avg(a[1]))
  if (posEntries.length >= 2) {
    const [bestPos, bestR] = posEntries[0]
    const [worstPos, worstR] = posEntries[posEntries.length - 1]
    const diff = avg(bestR) - avg(worstR)
    if (diff >= 0.3) {
      out.push({
        id: 'position',
        title: `${bestPos} is your strongest position`,
        body: `You average ${avg(bestR).toFixed(1)} at ${bestPos} across ${bestR.length} matches, vs. ${avg(worstR).toFixed(1)} at ${worstPos} — a ${diff.toFixed(1)}-point gap.`,
        action: `Make the case for more minutes at ${bestPos} — the data backs it.`,
        confidence: Math.min(89, 40 + (bestR.length + worstR.length) * 3),
        a: { label: worstPos, value: avg(worstR) },
        b: { label: bestPos, value: avg(bestR) },
      })
    }
  }

  /* result vs. rating (obvious, but quantified) */
  const wins = matches.filter(m => m.result === 'win').map(m => m.rating)
  const notWins = matches.filter(m => m.result && m.result !== 'win').map(m => m.rating)
  if (wins.length >= 2 && notWins.length >= 2) {
    const diff = avg(wins) - avg(notWins)
    out.push({
      id: 'result',
      title: diff >= 0.3 ? 'Your rating tracks the scoreline' : 'You perform consistently regardless of result',
      body: diff >= 0.3
        ? `${avg(wins).toFixed(1)} average in wins vs. ${avg(notWins).toFixed(1)} otherwise — your individual performance and team results move together.`
        : `${avg(wins).toFixed(1)} in wins vs. ${avg(notWins).toFixed(1)} otherwise — your output doesn't swing much with the result, which is rare and valuable.`,
      action: diff >= 0.3 ? 'Focus on the controllables in tight losses — that\'s where the gap likely opens.' : 'This consistency is a selling point for your recruit profile.',
      confidence: Math.min(85, 40 + (wins.length + notWins.length) * 3),
      a: { label: 'Non-wins', value: avg(notWins) },
      b: { label: 'Wins', value: avg(wins) },
    })
  }

  return out.sort((a, b) => b.confidence - a.confidence)
}

/* ── Future Development — trend-projected estimates ───────────────────────── */

export interface Projection {
  key: DNAKey
  label: string
  current: number
  projected: number
  low: number
  high: number
  driver: string
}

export function projectDevelopment(dna: DNAAttribute[]): Projection[] {
  return dna
    .filter(a => a.matches >= 3)
    .map(a => {
      /* simple linear extrapolation off the recent trend, damped so a hot
         streak doesn't imply infinite growth, with an uncertainty band that
         widens on thinner samples */
      const damped = a.trend * 0.6
      const projected = clamp(a.value + damped)
      const spread = clamp(18 - a.matches * 0.8, 6, 18)
      return {
        key: a.key,
        label: a.label,
        current: a.value,
        projected,
        low: clamp(projected - spread),
        high: clamp(projected + spread),
        driver: Math.abs(a.trend) < 0.5
          ? 'Holding steady — no strong recent trend either way.'
          : a.trend > 0
            ? `Trending up ${a.trend.toFixed(1)} pts over your last 5 matches.`
            : `Trending down ${Math.abs(a.trend).toFixed(1)} pts over your last 5 matches.`,
      }
    })
}

/* ── Consistency Engine ────────────────────────────────────────────────────── */

export interface ConsistencyMetric {
  label: string
  score: number      // 0-100, higher = more consistent
  spark: number[]
  note: string
}

function rollingStd(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const w = values.slice(Math.max(0, i - window + 1), i + 1)
    return std(w)
  })
}

export function buildConsistency(matches: Match[]): ConsistencyMetric[] {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 3) return []

  const series: { label: string; values: number[]; scaleMax: number; note: (v: number) => string }[] = [
    { label: 'Rating Stability', values: sorted.map(m => m.rating), scaleMax: 2.2,
      note: v => v >= 70 ? 'Your rating barely moves match to match — a dependable floor.' : 'Rating swings noticeably between matches.' },
    { label: 'Passing Consistency', values: sorted.map(m => m.passAccuracy), scaleMax: 22,
      note: v => v >= 70 ? 'Pass accuracy holds steady regardless of opponent or venue.' : 'Passing accuracy varies a fair amount match to match.' },
    { label: 'Fitness Consistency', values: sorted.map(m => m.distanceCovered), scaleMax: 4.5,
      note: v => v >= 70 ? 'Distance covered is stable — conditioning looks reliable.' : 'Distance covered fluctuates — fatigue or rotation may be a factor.' },
    { label: 'Output Consistency', values: sorted.map(m => m.goals + m.assists), scaleMax: 2,
      note: v => v >= 65 ? 'Goal involvement is repeatable, not streaky.' : 'Goals and assists cluster into hot and cold streaks.' },
  ]

  return series.map(s => {
    const volatility = std(s.values)
    const score = clamp(100 - (volatility / s.scaleMax) * 100)
    const spark = rollingStd(s.values, 3).map(v => clamp(100 - (v / s.scaleMax) * 100))
    return { label: s.label, score, spark, note: s.note(score) }
  })
}

/* ── Improvement Momentum ─────────────────────────────────────────────────── */

export interface Momentum {
  state: 'accelerating' | 'plateau' | 'decline' | 'recovering'
  label: string
  description: string
  spark: number[]
}

export function buildMomentum(matches: Match[]): Momentum | null {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 5) return null

  const spark = sorted.slice(-10).map(m => m.rating)
  const half = Math.max(2, Math.floor(sorted.length / 2))
  const firstHalf = sorted.slice(0, half).map(m => m.rating)
  const secondHalf = sorted.slice(half).map(m => m.rating)
  const recent3 = sorted.slice(-3).map(m => m.rating)
  const priorAvg = avg(firstHalf)
  const recentAvg = avg(secondHalf)
  const veryRecentAvg = avg(recent3)
  const overallDelta = recentAvg - priorAvg
  const lastStepDelta = veryRecentAvg - recentAvg

  if (overallDelta >= 0.35 && lastStepDelta >= 0) {
    return {
      state: 'accelerating', label: 'Improving Quickly',
      description: `Your rating is up ${overallDelta.toFixed(1)} over the season and still climbing in your last 3 matches. Whatever changed, it's working.`,
      spark,
    }
  }
  if (overallDelta >= 0.35 && lastStepDelta < -0.3) {
    return {
      state: 'plateau', label: 'Recent Dip After a Strong Run',
      description: `Season trend is up ${overallDelta.toFixed(1)}, but your last 3 matches cooled off ${Math.abs(lastStepDelta).toFixed(1)}. Likely a normal dip, not a reversal — worth a quick check on rest and role.`,
      spark,
    }
  }
  if (overallDelta <= -0.35 && lastStepDelta > 0.3) {
    return {
      state: 'recovering', label: 'Recovering',
      description: `The season dipped ${Math.abs(overallDelta).toFixed(1)} overall, but your last 3 matches are climbing back ${lastStepDelta.toFixed(1)}. The trend has turned.`,
      spark,
    }
  }
  if (overallDelta <= -0.35) {
    return {
      state: 'decline', label: 'Temporary Decline',
      description: `Rating is down ${Math.abs(overallDelta).toFixed(1)} over the season. Check the Consistency and Pattern Detection panels above for what's correlating with it.`,
      spark,
    }
  }
  return {
    state: 'plateau', label: 'Holding Steady',
    description: `Rating has moved less than half a point across the season (${overallDelta >= 0 ? '+' : ''}${overallDelta.toFixed(1)}) — a stable plateau. Small, targeted changes are the fastest way to break it.`,
    spark,
  }
}

/* ── Personal Records — across full career, not just current season ─────────── */

export interface PersonalRecord {
  label: string
  value: string
  sub: string
}

export function buildPersonalRecords(matches: Match[]): PersonalRecord[] {
  if (matches.length === 0) return []
  const byRating = [...matches].sort((a, b) => b.rating - a.rating)
  const byAssists = [...matches].sort((a, b) => b.assists - a.assists)
  const bySprint = [...matches].sort((a, b) => b.sprintSpeed - a.sprintSpeed)
  const byPass = [...matches].sort((a, b) => b.passAccuracy - a.passAccuracy)
  const byDistance = [...matches].sort((a, b) => b.distanceCovered - a.distanceCovered)

  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))
  let longest = 0, current = 0
  const seasonAvg = avg(matches.map(m => m.rating))
  sorted.forEach(m => {
    if (m.rating >= seasonAvg) { current++; longest = Math.max(longest, current) } else current = 0
  })

  const records: PersonalRecord[] = [
    { label: 'Highest Rating', value: byRating[0].rating.toFixed(1), sub: `vs ${byRating[0].opponent}` },
    { label: 'Longest Streak', value: `${longest}`, sub: 'matches above average' },
    { label: 'Most Assists', value: `${byAssists[0].assists}`, sub: `vs ${byAssists[0].opponent}` },
    { label: 'Fastest Sprint', value: `${bySprint[0].sprintSpeed.toFixed(1)} km/h`, sub: `vs ${bySprint[0].opponent}` },
    { label: 'Best Pass Accuracy', value: `${byPass[0].passAccuracy.toFixed(0)}%`, sub: `vs ${byPass[0].opponent}` },
    { label: 'Greatest Distance', value: `${byDistance[0].distanceCovered.toFixed(1)} km`, sub: `vs ${byDistance[0].opponent}` },
  ]
  return records
}
