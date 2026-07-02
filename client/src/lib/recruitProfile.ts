/* ═══ Recruit Profile intelligence ══════════════════════════════════════════
   The scouting-summary generator and the shareable-payload builder. The
   payload is deliberately a compact summary (not raw match history) so the
   public URL stays short — this mirrors how a real scouting report reads:
   conclusions plus their evidence, not a spreadsheet. */
import type { Match, PlayerProfile } from '@/types'
import { buildPersonalRecords, type DNAAttribute, type PlayingStyle } from './performanceIntel'
import { buildHighlights as buildTopHighlights } from './matchIntel'

export interface Milestone {
  id: string
  title: string
  date: string
  category: 'captain' | 'championship' | 'award' | 'performance' | 'academic' | 'community'
}

export interface RecruitStory {
  journey: string
  currentGoals: string
  developmentFocus: string
  ambitions: string
}

export interface VisibilitySettings {
  story: boolean
  highlights: boolean
  seasonSummary: boolean
  aiSummary: boolean
  matchHighlights: boolean
  trophyRoom: boolean
}

export const defaultVisibility: VisibilitySettings = {
  story: true, highlights: true, seasonSummary: true, aiSummary: true, matchHighlights: true, trophyRoom: true,
}

export const emptyStory: RecruitStory = { journey: '', currentGoals: '', developmentFocus: '', ambitions: '' }

export const MILESTONE_CATEGORY_LABEL: Record<Milestone['category'], string> = {
  captain: 'Captain', championship: 'Championship', award: 'Award',
  performance: 'Top Performance', academic: 'Academic', community: 'Community Service',
}

/* ── AI Scouting Summary — evidence-based vs. developmental, clearly split ── */
export interface AISummary {
  strengths: { text: string; evidenceBased: boolean }[]
  developing: { text: string; evidenceBased: boolean }[]
  playingIdentity: string
  identityConfidence: number
  futureFocus: string
}

export function buildAISummary(matches: Match[], dna: DNAAttribute[], style: PlayingStyle | null): AISummary {
  const sorted = [...dna].sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, 3).filter(a => a.value >= 55)
  const weak = [...dna].sort((a, b) => a.value - b.value).slice(0, 2)

  const strengths = top.map(a => ({
    text: `${a.label} (${a.value.toFixed(0)}/100) — ${a.explain}`,
    evidenceBased: matches.length >= 5,
  }))
  if (strengths.length === 0) {
    strengths.push({ text: 'Not enough matches logged yet to confidently identify standout strengths.', evidenceBased: false })
  }

  const developing = weak.map(a => ({
    text: `${a.label} — ${a.improve}`,
    evidenceBased: matches.length >= 5,
  }))

  return {
    strengths,
    developing,
    playingIdentity: style ? style.label : 'Developing identity — more matches will sharpen this.',
    identityConfidence: style ? style.confidence : 0,
    futureFocus: weak[0] ? weak[0].improve : 'Keep logging matches to unlock a focused development plan.',
  }
}

/* ── Shareable payload — respects visibility settings, stays compact ────── */
export interface SharePayload {
  v: 2 // schema version
  name: string
  position: string
  secondaryPosition?: string
  club: string
  graduationYear?: number
  height?: number
  weight?: number
  foot?: string
  nationality?: string
  avatarUrl?: string
  overall: number
  dna: { key: string; label: string; value: number }[]
  playingIdentity: string
  identityConfidence: number
  stats: { matches: number; goals: number; assists: number; avgRating: number; avgPassAccuracy: number; avgSprintSpeed: number; winRate: number }
  story?: RecruitStory
  milestones?: Milestone[]
  aiSummary?: AISummary
  records?: { label: string; value: string; sub: string }[]
  highlights?: { label: string; value: string; opponent: string }[]
  visibility: VisibilitySettings
}

export function buildSharePayload(
  profile: PlayerProfile & { graduationYear?: number },
  matches: Match[],
  dna: DNAAttribute[],
  style: PlayingStyle | null,
  story: RecruitStory,
  milestones: Milestone[],
  visibility: VisibilitySettings
): SharePayload {
  const wins = matches.filter(m => m.result === 'win').length
  const totalGoals = matches.reduce((s, m) => s + m.goals, 0)
  const totalAssists = matches.reduce((s, m) => s + m.assists, 0)
  const avgRating = matches.length ? matches.reduce((s, m) => s + m.rating, 0) / matches.length : 0
  const avgPassAccuracy = matches.length ? Math.round(matches.reduce((s, m) => s + m.passAccuracy, 0) / matches.length) : 0
  const avgSprintSpeed = matches.length ? +(matches.reduce((s, m) => s + m.sprintSpeed, 0) / matches.length).toFixed(1) : 0
  const overall = dna.length ? Math.round(dna.reduce((s, a) => s + a.value, 0) / dna.length) : 0
  const aiSummary = buildAISummary(matches, dna, style)

  return {
    v: 2,
    name: profile.name, position: profile.primaryPosition, secondaryPosition: profile.secondaryPosition,
    club: profile.club, graduationYear: profile.graduationYear,
    height: profile.height, weight: profile.weight, foot: profile.dominantFoot, nationality: profile.nationality,
    avatarUrl: profile.avatarUrl,
    overall,
    dna: dna.map(a => ({ key: a.key, label: a.label, value: Math.round(a.value) })),
    playingIdentity: style?.label ?? 'Developing identity',
    identityConfidence: style?.confidence ?? 0,
    stats: {
      matches: matches.length, goals: totalGoals, assists: totalAssists, avgRating,
      avgPassAccuracy, avgSprintSpeed, winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
    },
    story: visibility.story ? story : undefined,
    milestones: visibility.highlights ? milestones : undefined,
    aiSummary: visibility.aiSummary ? aiSummary : undefined,
    records: visibility.matchHighlights ? buildPersonalRecords(matches).map(r => ({ label: r.label, value: r.value, sub: r.sub })) : undefined,
    highlights: visibility.matchHighlights ? buildTopHighlights(matches).map(h => ({ label: h.label, value: h.value, opponent: h.match.opponent })) : undefined,
    visibility,
  }
}

function toBase64Url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromBase64Url(s: string) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(escape(atob(b64)))
}

export function encodePayload(payload: SharePayload): string {
  return toBase64Url(JSON.stringify(payload))
}

export function decodePayload(encoded: string): SharePayload | null {
  try { return JSON.parse(fromBase64Url(encoded)) as SharePayload } catch { return null }
}
