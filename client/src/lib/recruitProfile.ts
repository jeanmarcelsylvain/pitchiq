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
  personalInfo: boolean
  contact: boolean
  story: boolean
  highlights: boolean
  seasonSummary: boolean
  aiSummary: boolean
  performanceDNA: boolean
  matchHighlights: boolean
  trophyRoom: boolean
  reflections: boolean
}

export const defaultVisibility: VisibilitySettings = {
  personalInfo: true, contact: false, story: true, highlights: true, seasonSummary: true,
  aiSummary: true, performanceDNA: true, matchHighlights: true, trophyRoom: true, reflections: false,
}

export const VISIBILITY_LABEL: Record<keyof VisibilitySettings, { label: string; hint: string }> = {
  personalInfo: { label: 'Personal Information', hint: 'Age, height, weight, nationality' },
  contact: { label: 'Contact Information', hint: 'Email, phone, social — off by default' },
  story: { label: 'Player Story', hint: 'Your journey, goals, and ambitions' },
  highlights: { label: 'Career Highlights', hint: 'Milestones like captaincy and championships' },
  seasonSummary: { label: 'Season Summary', hint: 'Match count, rating, win rate' },
  aiSummary: { label: 'AI Summary', hint: 'Strengths and development areas' },
  performanceDNA: { label: 'Performance DNA', hint: 'The 7-attribute breakdown' },
  matchHighlights: { label: 'Achievements & Records', hint: 'Best matches and personal records' },
  trophyRoom: { label: 'Trophy Room', hint: 'Personal record highlights' },
  reflections: { label: 'Reflections', hint: 'Mood and confidence trends — off by default' },
}

export const emptyStory: RecruitStory = { journey: '', currentGoals: '', developmentFocus: '', ambitions: '' }

export interface ContactInfo {
  email?: string
  phone?: string
  instagram?: string
  twitter?: string
  hudlUrl?: string
  youtubeUrl?: string
}

export const emptyContact: ContactInfo = {}

/* ── Share Links — one profile, multiple audience-tuned links ────────────── */
export type ShareAudience = 'recruit' | 'coach' | 'parent' | 'public' | 'club'

export const AUDIENCE_META: Record<ShareAudience, { label: string; description: string; visibility: Partial<VisibilitySettings> }> = {
  recruit: { label: 'Recruit Link', description: 'For college coaches and recruiters — full performance picture', visibility: { ...defaultVisibility, contact: true } },
  coach: { label: 'Coach Link', description: 'For your current or prospective coach — includes reflections', visibility: { ...defaultVisibility, reflections: true, contact: true } },
  parent: { label: 'Parent Link', description: 'For family — everything visible, a full picture of progress', visibility: { ...defaultVisibility, reflections: true, contact: true } },
  public: { label: 'Public Link', description: 'For social media and general sharing — stats and story only', visibility: { ...defaultVisibility, contact: false, reflections: false } },
  club: { label: 'Future Club Link', description: 'For clubs you\'re trying out for — performance-focused', visibility: { ...defaultVisibility, contact: true } },
}

export interface ShareLink {
  id: string
  audience: ShareAudience
  label: string
  visibility: VisibilitySettings
  createdAt: string
  encoded: string
  views: number
  lastViewedAt?: string
}

/* ── Future architecture — types only, no UI beyond a "coming soon" state.
   Defined now so the eventual features (coach feedback, video/photo
   highlights) slot into the existing SharePayload/visibility system
   without a schema migration. ──────────────────────────────────────────── */
export interface CoachNote {
  id: string
  authorName: string
  authorRole: 'current_coach' | 'former_coach' | 'club_director' | 'trainer'
  visibility: 'private' | 'shared'
  verified: boolean
  comment: string
  createdAt: string
}

export interface HighlightMedia {
  id: string
  type: 'video' | 'photo' | 'training_clip' | 'coach_clip' | 'interview'
  url: string
  caption?: string
  addedAt: string
}

/* ── Trust legend — shown on every public profile ─────────────────────────── */
export const TRUST_LEGEND = [
  { key: 'verified', label: 'Verified Statistics', desc: 'Directly from logged matches', color: '#2dd4a0' },
  { key: 'ai', label: 'AI Interpretation', desc: 'Patterns detected from the data above', color: '#4d9fff' },
  { key: 'reflection', label: 'Player Reflections', desc: 'Self-reported after matches', color: '#ffba08' },
  { key: 'projection', label: 'Future Projection', desc: 'Trend-based estimate, not a guarantee', color: '#ff5a3c' },
] as const

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

/* ── Scout Mode match series — a compact, PII-free slice of each match used
   to power client-side scorecards/trajectory/shortlist/position charts on
   the public Scout Mode view. No id/userId/notes/reflection/tags/media —
   just the performance numbers, gated behind the same seasonSummary and
   performanceDNA toggles as the rest of the quantitative sections. ──────── */
export interface ScoutMatch {
  date: string
  opponent: string
  competition: string
  venue: 'home' | 'away' | 'neutral'
  result?: 'win' | 'loss' | 'draw'
  position: string
  minutesPlayed: number
  goals: number
  assists: number
  shots: number
  shotsOnTarget: number
  passAccuracy: number
  tackles: number
  interceptions: number
  distanceCovered: number
  sprintSpeed: number
  rating: number
}

function toScoutMatch(m: Match): ScoutMatch {
  return {
    date: m.date, opponent: m.opponent, competition: m.competition, venue: m.venue, result: m.result,
    position: m.position, minutesPlayed: m.minutesPlayed, goals: m.goals, assists: m.assists,
    shots: m.shots, shotsOnTarget: m.shotsOnTarget, passAccuracy: m.passAccuracy, tackles: m.tackles,
    interceptions: m.interceptions, distanceCovered: m.distanceCovered, sprintSpeed: m.sprintSpeed, rating: m.rating,
  }
}

/* ── Shareable payload — respects visibility settings, stays compact ────── */
export interface SharePayload {
  v: 4 // schema version
  audience?: ShareAudience
  name: string
  position: string
  secondaryPosition?: string
  club: string
  graduationYear?: number
  age?: number
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
  contact?: ContactInfo
  moodTrend?: { confidence: number; energy: number }[]
  matchSeries?: ScoutMatch[]
  previousSeason?: { name: string; matches: number; avgRating: number; goals: number; assists: number }
  visibility: VisibilitySettings
}

export function buildSharePayload(
  profile: PlayerProfile & { graduationYear?: number },
  matches: Match[],
  dna: DNAAttribute[],
  style: PlayingStyle | null,
  story: RecruitStory,
  milestones: Milestone[],
  contact: ContactInfo,
  visibility: VisibilitySettings,
  audience?: ShareAudience,
  previousSeason?: { name: string; matches: Match[] }
): SharePayload {
  const wins = matches.filter(m => m.result === 'win').length
  const totalGoals = matches.reduce((s, m) => s + m.goals, 0)
  const totalAssists = matches.reduce((s, m) => s + m.assists, 0)
  const avgRating = matches.length ? matches.reduce((s, m) => s + m.rating, 0) / matches.length : 0
  const avgPassAccuracy = matches.length ? Math.round(matches.reduce((s, m) => s + m.passAccuracy, 0) / matches.length) : 0
  const avgSprintSpeed = matches.length ? +(matches.reduce((s, m) => s + m.sprintSpeed, 0) / matches.length).toFixed(1) : 0
  const overall = dna.length ? Math.round(dna.reduce((s, a) => s + a.value, 0) / dna.length) : 0
  const aiSummary = buildAISummary(matches, dna, style)
  const reflected = matches.filter(m => m.reflection?.confidence !== undefined && m.reflection?.energy !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    v: 4,
    audience,
    name: profile.name, position: profile.primaryPosition, secondaryPosition: profile.secondaryPosition,
    club: profile.club, graduationYear: profile.graduationYear,
    age: visibility.personalInfo ? profile.age : undefined,
    height: visibility.personalInfo ? profile.height : undefined,
    weight: visibility.personalInfo ? profile.weight : undefined,
    foot: visibility.personalInfo ? profile.dominantFoot : undefined,
    nationality: visibility.personalInfo ? profile.nationality : undefined,
    avatarUrl: profile.avatarUrl,
    overall,
    dna: visibility.performanceDNA ? dna.map(a => ({ key: a.key, label: a.label, value: Math.round(a.value) })) : [],
    playingIdentity: style?.label ?? 'Developing identity',
    identityConfidence: style?.confidence ?? 0,
    stats: visibility.seasonSummary ? {
      matches: matches.length, goals: totalGoals, assists: totalAssists, avgRating,
      avgPassAccuracy, avgSprintSpeed, winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
    } : { matches: matches.length, goals: 0, assists: 0, avgRating: 0, avgPassAccuracy: 0, avgSprintSpeed: 0, winRate: 0 },
    story: visibility.story ? story : undefined,
    milestones: visibility.highlights ? milestones : undefined,
    aiSummary: visibility.aiSummary ? aiSummary : undefined,
    records: visibility.matchHighlights ? buildPersonalRecords(matches).map(r => ({ label: r.label, value: r.value, sub: r.sub })) : undefined,
    highlights: visibility.matchHighlights ? buildTopHighlights(matches).map(h => ({ label: h.label, value: h.value, opponent: h.match.opponent })) : undefined,
    contact: visibility.contact ? contact : undefined,
    moodTrend: visibility.reflections && reflected.length >= 2
      ? reflected.slice(-8).map(m => ({ confidence: m.reflection!.confidence!, energy: m.reflection!.energy! }))
      : undefined,
    matchSeries: visibility.seasonSummary && visibility.performanceDNA
      ? [...matches].sort((a, b) => a.date.localeCompare(b.date)).slice(-30).map(toScoutMatch)
      : undefined,
    previousSeason: visibility.seasonSummary && previousSeason && previousSeason.matches.length
      ? {
          name: previousSeason.name, matches: previousSeason.matches.length,
          avgRating: previousSeason.matches.reduce((s, m) => s + m.rating, 0) / previousSeason.matches.length,
          goals: previousSeason.matches.reduce((s, m) => s + m.goals, 0),
          assists: previousSeason.matches.reduce((s, m) => s + m.assists, 0),
        }
      : undefined,
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

/* ── Share Link management — stored per-athlete, one row per generated link ─
   View counts are honestly scoped: they only count visits recorded in this
   browser's localStorage (via recordView below), since there is no backend
   endpoint wired up to aggregate views across devices. The UI labels this
   clearly rather than presenting it as real cross-visitor analytics. */
function linksKey(uid: string) { return `recruit_share_links_${uid}` }

export function loadShareLinks(uid: string): ShareLink[] {
  try { return JSON.parse(localStorage.getItem(linksKey(uid)) ?? '[]') } catch { return [] }
}
export function saveShareLinks(uid: string, links: ShareLink[]) {
  localStorage.setItem(linksKey(uid), JSON.stringify(links))
}

/* view events recorded against a profile's encoded id, keyed globally (not
   per-uid) since the viewer is on a different device/session than the
   athlete — this only aggregates views that happen to occur in this same
   browser (e.g. the athlete previewing their own link). */
function viewKey(encodedId: string) { return `recruit_view_${encodedId.slice(0, 24)}` }

export function recordView(encoded: string) {
  try {
    const key = viewKey(encoded)
    const count = Number(localStorage.getItem(key) ?? '0') + 1
    localStorage.setItem(key, String(count))
    localStorage.setItem(`${key}_last`, new Date().toISOString())
  } catch { /* ignore */ }
}

export function getViewStats(encoded: string): { views: number; lastViewedAt: string | null } {
  try {
    const key = viewKey(encoded)
    return { views: Number(localStorage.getItem(key) ?? '0'), lastViewedAt: localStorage.getItem(`${key}_last`) }
  } catch { return { views: 0, lastViewedAt: null } }
}

/* ── QR code — via a public QR image service; the payload is just the
   already-public share URL, nothing sensitive crosses the wire beyond what
   the athlete is already about to share. */
export function qrCodeUrl(shareUrl: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&color=244-241-234&bgcolor=10-13-28&data=${encodeURIComponent(shareUrl)}`
}
