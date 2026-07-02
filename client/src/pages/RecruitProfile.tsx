/* ═══ Recruit Profile OS ══════════════════════════════════════════════════
   The editable, private side of the flagship public profile. Hero, story,
   milestones, contact info, and per-audience Share Links all live here —
   the public ScoutView just renders whatever a given link's visibility
   snapshot allows. */
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy, Check, Download, Plus, X, Eye, EyeOff, Trophy, Star, Sparkles,
  Link2, QrCode, Trash2, Mail, Instagram, Twitter, Film, MessageSquare, Image as ImageIcon,
} from 'lucide-react'
import { useAppData } from '@/hooks/useAppData'
import { useAuth } from '@/hooks/useAuth'
import { useCareerMatches } from '@/hooks/useCareerMatches'
import { color, font, ease } from '@/design/tokens'
import { Counter } from '@/design/motion'
import { ProgressRing } from '@/components/widgets/Widget'
import { PerformanceDNA } from '@/components/analytics/PerformanceDNA'
import { QRCode } from '@/components/recruit/QRCode'
import { buildDNA, classifyStyle, buildPersonalRecords } from '@/lib/performanceIntel'
import { buildHighlights } from '@/lib/matchIntel'
import {
  buildAISummary, buildSharePayload, encodePayload,
  defaultVisibility, emptyStory, emptyContact, MILESTONE_CATEGORY_LABEL, VISIBILITY_LABEL, AUDIENCE_META,
  loadShareLinks, saveShareLinks, getViewStats,
  type RecruitStory, type Milestone, type VisibilitySettings, type ContactInfo, type ShareLink, type ShareAudience,
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
  contact: ContactInfo
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
      if (raw) {
        const saved = JSON.parse(raw)
        return {
          story: { ...emptyStory, ...saved.story }, milestones: saved.milestones ?? [],
          contact: { ...emptyContact, ...saved.contact }, visibility: { ...defaultVisibility, ...saved.visibility },
          graduationYear: saved.graduationYear,
        }
      }
    } catch { /* ignore corrupt state */ }
    return { story: emptyStory, milestones: [], contact: emptyContact, visibility: defaultVisibility }
  })
  const [editingStory, setEditingStory] = useState(false)
  const [editingContact, setEditingContact] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', category: 'performance' as Milestone['category'] })
  const [links, setLinks] = useState<ShareLink[]>(() => loadShareLinks(uid))
  const [creatingAudience, setCreatingAudience] = useState<ShareAudience | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qrForId, setQrForId] = useState<string | null>(null)

  const persist = (next: RecruitExtras) => {
    setExtras(next)
    localStorage.setItem(storageKey(uid), JSON.stringify(next))
  }
  const persistLinks = (next: ShareLink[]) => { setLinks(next); saveShareLinks(uid, next) }

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

  const generateLink = (audience: ShareAudience) => {
    const visibility = { ...extras.visibility, ...AUDIENCE_META[audience].visibility } as VisibilitySettings
    const payload = buildSharePayload(
      { ...profile, graduationYear: extras.graduationYear }, careerMatches, dna, style,
      extras.story, extras.milestones, extras.contact, visibility, audience
    )
    const encoded = encodePayload(payload)
    const link: ShareLink = {
      id: crypto.randomUUID(), audience, label: AUDIENCE_META[audience].label,
      visibility, createdAt: new Date().toISOString(), encoded, views: 0,
    }
    persistLinks([link, ...links.filter(l => l.audience !== audience)])
    setCreatingAudience(null)
  }

  const copyLink = (link: ShareLink) => {
    const url = `${window.location.origin}/scout/${link.encoded}`
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  const deleteLink = (id: string) => persistLinks(links.filter(l => l.id !== id))

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
        <button onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-4 py-2 text-sm font-semibold text-white transition-all print:hidden">
          <Download className="h-4 w-4" /> Export Recruiting Packet (PDF)
        </button>
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

      {/* ── SHARE LINKS ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 print:hidden" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="h-4 w-4" style={{ color: color.accentSoft }} />
          <p style={sectionLabel} className="uppercase">Share Links</p>
        </div>
        <p style={{ ...B, fontSize: '0.78rem', color: color.inkMuted }} className="mb-4">Each audience gets exactly what they need — nothing more.</p>

        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.keys(AUDIENCE_META) as ShareAudience[]).map(a => {
            const existing = links.find(l => l.audience === a)
            return (
              <button key={a} onClick={() => setCreatingAudience(a)}
                className="rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                style={{ ...BC, background: existing ? 'rgba(45,212,160,0.08)' : color.bg, color: existing ? color.emerald : color.inkMuted, border: `1px solid ${existing ? 'rgba(45,212,160,0.3)' : color.border}` }}>
                {AUDIENCE_META[a].label} {existing ? '✓' : ''}
              </button>
            )
          })}
        </div>

        <AnimatePresence>
          {creatingAudience && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-5 rounded-lg p-4 overflow-hidden" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
              <p style={{ ...BC, fontSize: '0.9rem', fontWeight: 700, color: color.ink }}>{AUDIENCE_META[creatingAudience].label}</p>
              <p style={{ ...B, fontSize: '0.78rem', color: color.inkMuted }} className="mt-1 mb-3">{AUDIENCE_META[creatingAudience].description}</p>
              <div className="flex gap-2">
                <button onClick={() => generateLink(creatingAudience)} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ ...BC, background: color.accent, color: color.bg }}>
                  Generate Link
                </button>
                <button onClick={() => setCreatingAudience(null)} style={{ ...B, fontSize: '0.78rem', color: color.inkMuted }}>Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {links.length === 0 ? (
          <EmptySection text="Generate your first share link above — each one carries its own visibility settings." />
        ) : (
          <div className="space-y-2.5">
            {links.map(link => {
              const url = `${window.location.origin}/scout/${link.encoded}`
              const stats = getViewStats(link.encoded)
              return (
                <div key={link.id} className="rounded-lg p-3.5" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p style={{ ...BC, fontSize: '0.85rem', fontWeight: 700, color: color.ink }}>{link.label}</p>
                      <p style={{ ...MONO, fontSize: '0.66rem', color: color.inkMuted }} className="truncate max-w-xs">{url}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>
                        {stats.views} view{stats.views === 1 ? '' : 's'} <span className="opacity-60">(this device)</span>
                      </span>
                      <button onClick={() => setQrForId(qrForId === link.id ? null : link.id)} aria-label="Show QR code"
                        className="rounded-md p-1.5 transition-colors hover:bg-white/5" style={{ color: color.inkMuted }}>
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button onClick={() => copyLink(link)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold"
                        style={{ ...BC, background: color.surface, color: copiedId === link.id ? color.emerald : color.inkDim, border: `1px solid ${color.border}` }}>
                        {copiedId === link.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copiedId === link.id ? 'Copied' : 'Copy'}
                      </button>
                      <button onClick={() => deleteLink(link.id)} aria-label={`Delete ${link.label}`} className="rounded-md p-1.5 hover:text-white" style={{ color: color.inkMuted }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {qrForId === link.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="pt-4 mt-3 flex justify-center overflow-hidden" style={{ borderTop: `1px solid ${color.border}` }}>
                        <QRCode url={url} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── DEFAULT VISIBILITY ───────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 print:hidden" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
        <p style={sectionLabel} className="uppercase mb-1">Default Visibility</p>
        <p style={{ ...B, fontSize: '0.78rem', color: color.inkMuted }} className="mb-4">Applied to new share links unless the audience preset overrides it.</p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {(Object.keys(VISIBILITY_LABEL) as (keyof VisibilitySettings)[]).map(key => (
            <button key={key} onClick={() => toggleVisibility(key)} aria-pressed={extras.visibility[key]}
              className="flex items-center justify-between gap-3 rounded-lg p-3 text-left transition-colors"
              style={{ background: color.bg, border: `1px solid ${color.border}` }}>
              <div>
                <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, fontWeight: 500 }}>{VISIBILITY_LABEL[key].label}</p>
                <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>{VISIBILITY_LABEL[key].hint}</p>
              </div>
              {extras.visibility[key] ? <Eye className="h-4 w-4 shrink-0" style={{ color: color.emerald }} /> : <EyeOff className="h-4 w-4 shrink-0" style={{ color: color.inkMuted }} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── PERFORMANCE DNA + AI SUMMARY ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
          <p style={sectionLabel} className="uppercase mb-4">Performance DNA</p>
          {dna.length > 0 ? <PerformanceDNA attributes={dna} /> : <EmptySection text="Log matches to build a Performance DNA profile." />}
        </div>
        <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
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
        </div>
      </div>

      {/* ── PLAYER STORY ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
        <p style={sectionLabel} className="uppercase mb-4">Player Story</p>
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
            <button onClick={() => setEditingStory(true)} className="mt-3 text-xs font-semibold print:hidden" style={{ ...BC, color: color.accentSoft }}>Edit Story</button>
          </div>
        )}
      </div>

      {/* ── CONTACT INFO ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-4 w-4" style={{ color: color.inkMuted }} />
          <p style={sectionLabel} className="uppercase">Contact Information</p>
          <span style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }} className="ml-1">— off by default, enable per share link</span>
        </div>
        {editingContact ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {([['email', 'Email'], ['phone', 'Phone (optional)'], ['instagram', 'Instagram'], ['twitter', 'Twitter/X'], ['hudlUrl', 'Hudl Profile'], ['youtubeUrl', 'YouTube / Video']] as const).map(([key, label]) => (
              <div key={key}>
                <label style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }} className="block mb-1">{label}</label>
                <input value={extras.contact[key] ?? ''} onChange={e => setExtras(prev => ({ ...prev, contact: { ...prev.contact, [key]: e.target.value } }))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ ...B, color: color.ink, background: color.bg, border: `1px solid ${color.border}` }} />
              </div>
            ))}
            <button onClick={() => { persist(extras); setEditingContact(false) }}
              className="sm:col-span-2 rounded-lg px-3 py-1.5 text-xs font-bold w-fit" style={{ ...BC, background: color.accent, color: color.bg }}>Save Contact Info</button>
          </div>
        ) : (
          <div>
            {Object.values(extras.contact).some(v => v) ? (
              <div className="flex flex-wrap gap-3">
                {extras.contact.email && <span className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.8rem', color: color.inkDim }}><Mail className="h-3.5 w-3.5" />{extras.contact.email}</span>}
                {extras.contact.instagram && <span className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.8rem', color: color.inkDim }}><Instagram className="h-3.5 w-3.5" />{extras.contact.instagram}</span>}
                {extras.contact.twitter && <span className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.8rem', color: color.inkDim }}><Twitter className="h-3.5 w-3.5" />{extras.contact.twitter}</span>}
                {extras.contact.youtubeUrl && <span className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.8rem', color: color.inkDim }}><Film className="h-3.5 w-3.5" />Video linked</span>}
              </div>
            ) : <p style={{ ...B, fontSize: '0.82rem', color: color.inkMuted }}>Add contact info so serious recruiters can reach you.</p>}
            <button onClick={() => setEditingContact(true)} className="mt-3 text-xs font-semibold print:hidden" style={{ ...BC, color: color.accentSoft }}>Edit Contact Info</button>
          </div>
        )}
      </div>

      {/* ── HIGHLIGHTS TIMELINE ──────────────────────────────────────────── */}
      <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
        <p style={sectionLabel} className="uppercase mb-4">Career Highlights</p>
        <div className="flex flex-wrap gap-2 mb-4 print:hidden">
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
                <button onClick={() => removeMilestone(m.id)} aria-label={`Remove ${m.title}`} style={{ color: color.inkMuted }} className="hover:text-white print:hidden"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MATCH HIGHLIGHTS + TROPHY ROOM ───────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
          <p style={sectionLabel} className="uppercase mb-4">Match Highlights</p>
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
        </div>
        <div className="rounded-2xl p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
          <p style={sectionLabel} className="uppercase mb-4">Trophy Room Preview</p>
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
        </div>
      </div>

      {/* ── COMING SOON — architecture ready, not fully built ────────────── */}
      <div className="grid lg:grid-cols-2 gap-5 print:hidden">
        <ComingSoon icon={MessageSquare} title="Coach Notes" text="Private and shared coach comments, club evaluations, and verification — architecture is in place, coming in a future update." />
        <ComingSoon icon={ImageIcon} title="Highlight Media" text="Highlight videos, photos, training clips, and interviews. The data model is ready; uploads are coming soon." />
      </div>
    </div>
  )
}

function ComingSoon({ icon: Icon, title, text }: { icon: typeof MessageSquare; title: string; text: string }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(37,43,77,0.25)', border: `1px dashed ${color.border}` }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color: color.inkMuted }} />
        <p style={sectionLabel} className="uppercase">{title}</p>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ ...BC, background: 'rgba(154,151,184,0.12)', color: color.inkMuted }}>COMING SOON</span>
      </div>
      <p style={{ ...B, fontSize: '0.78rem', color: color.inkMuted, lineHeight: 1.5 }}>{text}</p>
    </div>
  )
}

function EmptySection({ text }: { text: string }) {
  return <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }}>{text}</p>
}
