/* ═══ Recruit Profile OS ══════════════════════════════════════════════════
   The editable, private side of the flagship public profile. Everything
   here feeds the shareable ScoutView — hero, story, milestones, and
   per-section visibility controls live here; the public page just renders
   what's toggled on. */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Download, Plus, X, Eye, EyeOff, Trophy, Star, Sparkles } from 'lucide-react'
import { useAppData } from '@/hooks/useAppData'
import { useAuth } from '@/hooks/useAuth'
import { useCareerMatches } from '@/hooks/useCareerMatches'
import { color, font, ease } from '@/design/tokens'
import { Counter } from '@/design/motion'
import { ProgressRing } from '@/components/widgets/Widget'
import { PerformanceDNA } from '@/components/analytics/PerformanceDNA'
import { buildDNA, classifyStyle, buildPersonalRecords } from '@/lib/performanceIntel'
import { buildHighlights } from '@/lib/matchIntel'
import {
  buildAISummary, buildSharePayload, encodePayload,
  defaultVisibility, emptyStory, MILESTONE_CATEGORY_LABEL,
  type RecruitStory, type Milestone, type VisibilitySettings,
} from '@/lib/recruitProfile'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }
const sectionLabel = { ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const

function storageKey(uid: string) { return `recruit_profile_${uid}` }

interface RecruitExtras {
  graduationYear?: number
  story: RecruitStory
  milestones: Milestone[]
  visibility: VisibilitySettings
}

export default function RecruitProfile() {
  const { profile } = useAppData()
  const { user, isDemoMode } = useAuth()
  const { careerMatches } = useCareerMatches()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  const [extras, setExtras] = useState<RecruitExtras>(() => {
    try {
      const raw = localStorage.getItem(storageKey(uid))
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return { story: emptyStory, milestones: [], visibility: defaultVisibility }
  })
  const [copied, setCopied] = useState(false)
  const [editingStory, setEditingStory] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', category: 'performance' as Milestone['category'] })

  const persist = (next: RecruitExtras) => {
    setExtras(next)
    localStorage.setItem(storageKey(uid), JSON.stringify(next))
  }

  const dna = useMemo(() => buildDNA(careerMatches), [careerMatches])
  const style = useMemo(() => classifyStyle(careerMatches, dna), [careerMatches, dna])
  const overall = dna.length ? Math.round(dna.reduce((s, a) => s + a.value, 0) / dna.length) : 0
  const records = useMemo(() => buildPersonalRecords(careerMatches), [careerMatches])
  const highlights = useMemo(() => buildHighlights(careerMatches), [careerMatches])
  const aiSummary = useMemo(() => buildAISummary(careerMatches, dna, style), [careerMatches, dna, style])

  const wins = careerMatches.filter(m => m.result === 'win').length
  const totalGoals = careerMatches.reduce((s, m) => s + m.goals, 0)
  const totalAssists = careerMatches.reduce((s, m) => s + m.assists, 0)
  const avgRating = careerMatches.length ? careerMatches.reduce((s, m) => s + m.rating, 0) / careerMatches.length : 0
  const avgPassAcc = careerMatches.length ? Math.round(careerMatches.reduce((s, m) => s + m.passAccuracy, 0) / careerMatches.length) : 0
  const avgDistance = careerMatches.length ? (careerMatches.reduce((s, m) => s + m.distanceCovered, 0) / careerMatches.length).toFixed(1) : '0'

  const handleShare = () => {
    const payload = buildSharePayload(
      { ...profile, graduationYear: extras.graduationYear }, careerMatches, dna, style,
      extras.story, extras.milestones, extras.visibility
    )
    const encoded = encodePayload(payload)
    const url = `${window.location.origin}/scout/${encoded}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const addMilestone = () => {
    if (!newMilestone.title.trim()) return
    const m: Milestone = { id: crypto.randomUUID(), title: newMilestone.title, date: new Date().toISOString().slice(0, 10), category: newMilestone.category }
    persist({ ...extras, milestones: [m, ...extras.milestones] })
    setNewMilestone({ title: '', category: 'performance' })
  }
  const removeMilestone = (id: string) => persist({ ...extras, milestones: extras.milestones.filter(m => m.id !== id) })
  const toggleVisibility = (key: keyof VisibilitySettings) => persist({ ...extras, visibility: { ...extras.visibility, [key]: !extras.visibility[key] } })

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'P'

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p style={sectionLabel} className="uppercase">Recruit Profile</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Your public showcase.</h1>
          <p className="mt-1 text-sm text-slate-500">What a coach sees within 30 seconds — no login required.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:text-white transition-all">
            {copied ? <Check className="h-4 w-4 text-pitch-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link copied!' : 'Copy share link'}
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-4 py-2 text-sm font-semibold text-white transition-all">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        className="relative overflow-hidden rounded-2xl border border-slate-800/80 p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, rgba(23,28,56,0.92), rgba(10,13,28,0.97) 60%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-pitch-600/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl text-3xl font-black"
            style={{ ...BC, background: 'rgba(255,90,60,0.14)', border: `1px solid rgba(255,90,60,0.3)`, color: color.accentSoft }}>
            {initials}
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold text-white">{profile.name ?? 'Player'}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{ ...BC, background: 'rgba(255,90,60,0.16)', color: color.accentSoft }}>{profile.primaryPosition}</span>
              {profile.secondaryPosition && <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ ...BC, background: color.surface, color: color.inkMuted, border: `1px solid ${color.border}` }}>{profile.secondaryPosition}</span>}
              {profile.club && <span style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }}>{profile.club}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1" style={{ ...MONO, fontSize: '0.72rem', color: color.inkMuted }}>
              {profile.age && <span>Age {profile.age}</span>}
              {extras.graduationYear && <span>Class of {extras.graduationYear}</span>}
              {profile.height && <span>{profile.height}cm</span>}
              {profile.weight && <span>{profile.weight}kg</span>}
              {profile.dominantFoot && <span>{profile.dominantFoot} foot</span>}
              {profile.nationality && <span>{profile.nationality}</span>}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 justify-self-center lg:justify-self-end">
            <ProgressRing value={overall} max={100} size={110} stroke={6}
              label={<span className="font-display text-3xl font-extrabold text-white"><Counter to={overall} /></span>} sub="overall" />
          </div>
        </div>
      </motion.div>

      {/* ── QUICK SNAPSHOT ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          ['Matches', careerMatches.length], ['Season Rtg', avgRating.toFixed(1)], ['Goals', totalGoals], ['Assists', totalAssists],
          ['Pass Acc', `${avgPassAcc}%`], ['Distance', `${avgDistance}km`], ['Win Rate', careerMatches.length ? `${Math.round((wins / careerMatches.length) * 100)}%` : '—'],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl p-3.5 text-center" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
            <p style={{ ...BC, fontSize: '1.3rem', fontWeight: 800, color: color.ink }}>{v}</p>
            <p style={{ ...B, fontSize: '0.62rem', color: color.inkMuted }}>{l}</p>
          </div>
        ))}
      </div>

      {/* ── PERFORMANCE DNA + AI SUMMARY ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
          <p style={sectionLabel} className="uppercase mb-4">Performance DNA</p>
          {dna.length > 0 ? <PerformanceDNA attributes={dna} /> : <EmptySection text="Log matches to build a Performance DNA profile." />}
        </div>
        <VisibilityCard title="AI Scouting Summary" enabled={extras.visibility.aiSummary} onToggle={() => toggleVisibility('aiSummary')}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" style={{ color: color.ai }} />
            <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.ink }}>{aiSummary.playingIdentity}</p>
          </div>
          <div className="space-y-1.5 mb-4">
            {aiSummary.strengths.map((s, i) => (
              <p key={i} style={{ ...B, fontSize: '0.78rem', color: color.inkDim, lineHeight: 1.5 }}>
                <span style={{ color: s.evidenceBased ? color.emerald : color.warn }}>●</span> {s.text}
              </p>
            ))}
          </div>
          <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.1em', color: color.inkMuted }} className="uppercase mb-1">Development Focus</p>
          <p style={{ ...B, fontSize: '0.78rem', color: color.inkDim, lineHeight: 1.5 }}>{aiSummary.futureFocus}</p>
        </VisibilityCard>
      </div>

      {/* ── PLAYER STORY ──────────────────────────────────────────────────── */}
      <VisibilityCard title="Player Story" enabled={extras.visibility.story} onToggle={() => toggleVisibility('story')}>
        {editingStory ? (
          <div className="space-y-3">
            {(['journey', 'currentGoals', 'developmentFocus', 'ambitions'] as const).map(field => (
              <div key={field}>
                <label style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }} className="block mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                <textarea rows={2} value={extras.story[field]}
                  onChange={e => setExtras(prev => ({ ...prev, story: { ...prev.story, [field]: e.target.value } }))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ ...B, color: color.ink, background: color.bg, border: `1px solid ${color.border}` }} />
              </div>
            ))}
            <button onClick={() => { persist(extras); setEditingStory(false) }}
              className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ ...BC, background: color.accent, color: color.bg }}>Save Story</button>
          </div>
        ) : (
          <div>
            {Object.values(extras.story).some(v => v) ? (
              <div className="space-y-3">
                {extras.story.journey && <p style={{ ...B, fontSize: '0.85rem', color: color.inkDim, lineHeight: 1.65 }}>{extras.story.journey}</p>}
                {extras.story.currentGoals && <p style={{ ...B, fontSize: '0.82rem', color: color.inkMuted, lineHeight: 1.6 }}><strong style={{ color: color.inkDim }}>Current goals: </strong>{extras.story.currentGoals}</p>}
                {extras.story.ambitions && <p style={{ ...B, fontSize: '0.82rem', color: color.inkMuted, lineHeight: 1.6 }}><strong style={{ color: color.inkDim }}>Ambitions: </strong>{extras.story.ambitions}</p>}
              </div>
            ) : <p style={{ ...B, fontSize: '0.82rem', color: color.inkMuted }}>Add your story so recruiters understand who you are, not just your stats.</p>}
            <button onClick={() => setEditingStory(true)} className="mt-3 text-xs font-semibold" style={{ ...BC, color: color.accentSoft }}>Edit Story</button>
          </div>
        )}
      </VisibilityCard>

      {/* ── HIGHLIGHTS TIMELINE ──────────────────────────────────────────── */}
      <VisibilityCard title="Career Highlights" enabled={extras.visibility.highlights} onToggle={() => toggleVisibility('highlights')}>
        <div className="flex flex-wrap gap-2 mb-4">
          <input value={newMilestone.title} onChange={e => setNewMilestone(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Team Captain, State Champion" onKeyDown={e => e.key === 'Enter' && addMilestone()}
            className="flex-1 min-w-[200px] rounded-lg px-3 py-2 text-sm outline-none"
            style={{ ...B, color: color.ink, background: color.bg, border: `1px solid ${color.border}` }} />
          <select value={newMilestone.category} onChange={e => setNewMilestone(p => ({ ...p, category: e.target.value as Milestone['category'] }))}
            className="rounded-lg px-2 py-2 text-xs" style={{ ...B, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }}>
            {Object.entries(MILESTONE_CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={addMilestone} className="rounded-lg px-3 flex items-center" style={{ background: color.accent, color: color.bg }} aria-label="Add milestone"><Plus className="h-4 w-4" /></button>
        </div>
        {extras.milestones.length === 0 ? <EmptySection text="Add milestones like captaincy, championships, and awards." /> : (
          <div className="space-y-2">
            {extras.milestones.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg p-3" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-4 w-4 shrink-0" style={{ color: '#ffba08' }} />
                  <div>
                    <p style={{ ...BC, fontSize: '0.85rem', fontWeight: 700, color: color.ink }}>{m.title}</p>
                    <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>{MILESTONE_CATEGORY_LABEL[m.category]} · {m.date}</p>
                  </div>
                </div>
                <button onClick={() => removeMilestone(m.id)} aria-label={`Remove ${m.title}`} style={{ color: color.inkMuted }} className="hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </VisibilityCard>

      {/* ── MATCH HIGHLIGHTS + TROPHY ROOM ───────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <VisibilityCard title="Match Highlights" enabled={extras.visibility.matchHighlights} onToggle={() => toggleVisibility('matchHighlights')}>
          {highlights.length === 0 ? <EmptySection text="Log more matches to surface highlights." /> : (
            <div className="grid grid-cols-2 gap-2.5">
              {highlights.map(h => (
                <div key={h.label} className="rounded-lg p-3" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                  <p style={{ ...BC, fontSize: '0.55rem', letterSpacing: '0.1em', color: color.inkMuted }}>{h.label.toUpperCase()}</p>
                  <p style={{ ...BC, fontSize: '1.1rem', fontWeight: 800, color: color.accentSoft }}>{h.value}</p>
                  <p style={{ ...B, fontSize: '0.6rem', color: color.inkMuted }}>vs {h.match.opponent}</p>
                </div>
              ))}
            </div>
          )}
        </VisibilityCard>
        <VisibilityCard title="Trophy Room Preview" enabled={extras.visibility.trophyRoom} onToggle={() => toggleVisibility('trophyRoom')}>
          {records.length === 0 ? <EmptySection text="Personal records will appear here." /> : (
            <div className="grid grid-cols-3 gap-2.5">
              {records.slice(0, 3).map(r => (
                <div key={r.label} className="rounded-lg p-3 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,186,8,0.08), transparent)', border: `1px solid ${color.border}` }}>
                  <Star className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: '#ffba08' }} />
                  <p style={{ ...BC, fontSize: '1rem', fontWeight: 800, color: color.ink }}>{r.value}</p>
                  <p style={{ ...B, fontSize: '0.58rem', color: color.inkMuted }}>{r.label}</p>
                </div>
              ))}
            </div>
          )}
        </VisibilityCard>
      </div>
    </div>
  )
}

function VisibilityCard({ title, enabled, onToggle, children }: { title: string; enabled: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}`, opacity: enabled ? 1 : 0.6 }}>
      <div className="flex items-center justify-between mb-4">
        <p style={sectionLabel} className="uppercase">{title}</p>
        <button onClick={onToggle} aria-pressed={enabled}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
          style={{ ...BC, background: enabled ? 'rgba(45,212,160,0.1)' : 'rgba(154,151,184,0.1)', color: enabled ? color.emerald : color.inkMuted, border: `1px solid ${enabled ? 'rgba(45,212,160,0.3)' : color.border}` }}>
          {enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {enabled ? 'Public' : 'Hidden'}
        </button>
      </div>
      {children}
    </div>
  )
}

function EmptySection({ text }: { text: string }) {
  return <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }}>{text}</p>
}
