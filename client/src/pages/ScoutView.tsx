/* ═══ Scout View — the public face of PitchIQ ═══════════════════════════════
   No login. No nav chrome. Answers "who is this player, what do they play,
   are they improving, what's the evidence" within seconds, then lets a
   coach go deeper via progressive disclosure. Built to be opened on a
   phone moments before kickoff. */
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Trophy, Star, TrendingUp, ShieldCheck, Mail, Instagram, Twitter, Film } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { decodePayload, recordView, MILESTONE_CATEGORY_LABEL, TRUST_LEGEND } from '@/lib/recruitProfile'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

const DNA_COLORS = ['#ff5a3c', '#ff7a60', '#4d9fff', '#2dd4a0', '#ffba08', '#a78bfa', '#ff4d9e']

export default function ScoutView() {
  const { encoded } = useParams<{ encoded: string }>()
  const data = encoded ? decodePayload(encoded) : null

  useEffect(() => {
    if (data && encoded) {
      document.title = `${data.name} — ${data.position} · PitchIQ Recruit Profile`
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', `${data.name}, ${data.position}${data.club ? ` at ${data.club}` : ''} — ${data.stats.matches} matches, ${data.stats.avgRating.toFixed(1)} average rating. View verified performance data on PitchIQ.`)
      recordView(encoded)
    }
    return () => { document.title = 'PitchIQ — Know Your Game' }
  }, [data, encoded])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: color.bg }}>
        <p style={{ ...B, color: color.inkMuted }}>This profile link is invalid or has expired.</p>
      </div>
    )
  }

  const initials = data.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const identityLabel = data.identityConfidence >= 65 ? data.playingIdentity : `${data.playingIdentity} (developing)`

  return (
    <div style={{ background: color.bg, color: color.ink, minHeight: '100vh' }} className="font-sans">
      {/* minimal nav — trust mark only */}
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${color.border}` }}>
        <div className="flex items-center gap-2">
          <span style={{ ...BC, fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.9rem', color: color.ink }}>PITCHIQ</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }}>
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: color.emerald }} /> Verified Player Data
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* ── HERO — answers "who, what position, what rating" instantly ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
          style={{ background: 'linear-gradient(135deg, rgba(23,28,56,0.92), rgba(10,13,28,0.97) 60%)', border: `1px solid ${color.border}` }}>
          <div aria-hidden className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-pitch-600/10 blur-3xl" />
          <div className="relative grid gap-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl text-3xl font-black"
              style={{ ...BC, background: 'rgba(255,90,60,0.14)', border: `1px solid rgba(255,90,60,0.3)`, color: color.accentSoft }}>
              {initials}
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">{data.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{ ...BC, background: 'rgba(255,90,60,0.16)', color: color.accentSoft }}>{data.position}</span>
                {data.secondaryPosition && <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ ...BC, background: color.surface, color: color.inkMuted, border: `1px solid ${color.border}` }}>{data.secondaryPosition}</span>}
                {data.club && <span style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }}>{data.club}</span>}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1" style={{ ...MONO, fontSize: '0.7rem', color: color.inkMuted }}>
                {data.graduationYear && <span>Class of {data.graduationYear}</span>}
                {data.height && <span>{data.height}cm</span>}
                {data.weight && <span>{data.weight}kg</span>}
                {data.foot && <span>{data.foot} foot</span>}
                {data.nationality && <span>{data.nationality}</span>}
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p style={{ ...BC, fontSize: '2.5rem', fontWeight: 900, color: color.accentSoft, lineHeight: 1 }}>{data.overall}</p>
              <p style={{ ...BC, fontSize: '0.58rem', letterSpacing: '0.14em', color: color.inkMuted }}>OVERALL</p>
            </div>
          </div>

          {/* playing identity — the "what should I watch for" line */}
          <div className="relative mt-5 flex items-center gap-2 rounded-lg p-3" style={{ background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.16)' }}>
            <Sparkles className="h-4 w-4 shrink-0" style={{ color: color.ai }} />
            <p style={{ ...B, fontSize: '0.82rem', color: color.inkDim }}><strong style={{ color: color.ai }}>{identityLabel}</strong> — {data.stats.matches} matches logged, {data.stats.avgRating.toFixed(1)} average rating</p>
          </div>
        </motion.div>

        {/* ── QUICK SNAPSHOT ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {[
            ['Matches', data.stats.matches], ['Goals', data.stats.goals], ['Assists', data.stats.assists],
            ['Rating', data.stats.avgRating.toFixed(1)], ['Pass %', `${data.stats.avgPassAccuracy}%`], ['Win %', `${data.stats.winRate}%`],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-xl p-3 text-center" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
              <p style={{ ...BC, fontSize: '1.15rem', fontWeight: 800, color: color.ink }}>{v}</p>
              <p style={{ ...B, fontSize: '0.6rem', color: color.inkMuted }}>{l}</p>
            </div>
          ))}
        </div>

        {/* ── PERFORMANCE DNA ───────────────────────────────────────────── */}
        {data.dna.length > 0 && (
          <Section title="Performance DNA">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {data.dna.map((a, i) => (
                <div key={a.key} className="rounded-lg p-3" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: DNA_COLORS[i % DNA_COLORS.length] }} />
                    <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>{a.label}</p>
                  </div>
                  <p style={{ ...BC, fontSize: '1.3rem', fontWeight: 800, color: color.ink }}>{a.value}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── AI SCOUTING SUMMARY ───────────────────────────────────────── */}
        {data.aiSummary && (
          <Section title="AI Scouting Summary" icon={Sparkles} iconColor={color.ai}>
            <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.1em', color: color.emerald }} className="uppercase mb-1.5">Strengths</p>
            <div className="space-y-1.5 mb-4">
              {data.aiSummary.strengths.map((s, i) => (
                <p key={i} style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.55 }}>
                  <span style={{ color: s.evidenceBased ? color.emerald : color.warn }}>{s.evidenceBased ? '●' : '○'}</span> {s.text}
                </p>
              ))}
            </div>
            <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.1em', color: color.accentSoft }} className="uppercase mb-1.5">Developing</p>
            <div className="space-y-1.5 mb-3">
              {data.aiSummary.developing.map((s, i) => (
                <p key={i} style={{ ...B, fontSize: '0.8rem', color: color.inkMuted, lineHeight: 1.55 }}>· {s.text}</p>
              ))}
            </div>
            <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>● Evidence-based from logged matches &nbsp;·&nbsp; ○ Developmental suggestion</p>
          </Section>
        )}

        {/* ── PLAYER STORY ──────────────────────────────────────────────── */}
        {data.story && (data.story.journey || data.story.currentGoals || data.story.ambitions) && (
          <Section title="Player Story">
            <div className="space-y-3">
              {data.story.journey && <p style={{ ...B, fontSize: '0.88rem', color: color.inkDim, lineHeight: 1.7 }}>{data.story.journey}</p>}
              {data.story.currentGoals && <p style={{ ...B, fontSize: '0.82rem', color: color.inkMuted, lineHeight: 1.6 }}><strong style={{ color: color.inkDim }}>Current goals: </strong>{data.story.currentGoals}</p>}
              {data.story.ambitions && <p style={{ ...B, fontSize: '0.82rem', color: color.inkMuted, lineHeight: 1.6 }}><strong style={{ color: color.inkDim }}>Ambitions: </strong>{data.story.ambitions}</p>}
            </div>
          </Section>
        )}

        {/* ── HIGHLIGHTS TIMELINE ───────────────────────────────────────── */}
        {data.milestones && data.milestones.length > 0 && (
          <Section title="Career Highlights" icon={Trophy} iconColor="#ffba08">
            <div className="space-y-2">
              {data.milestones.map(m => (
                <div key={m.id} className="flex items-center gap-2.5 rounded-lg p-3" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                  <Trophy className="h-4 w-4 shrink-0" style={{ color: '#ffba08' }} />
                  <div>
                    <p style={{ ...BC, fontSize: '0.85rem', fontWeight: 700, color: color.ink }}>{m.title}</p>
                    <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>{MILESTONE_CATEGORY_LABEL[m.category]}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── MATCH HIGHLIGHTS + RECORDS ────────────────────────────────── */}
        {(data.highlights?.length || data.records?.length) ? (
          <Section title="Match Highlights & Records" icon={Star} iconColor="#ffba08">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[...(data.highlights ?? []), ...(data.records ?? [])].slice(0, 6).map((h, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                  <p style={{ ...BC, fontSize: '0.55rem', letterSpacing: '0.08em', color: color.inkMuted }}>{h.label.toUpperCase()}</p>
                  <p style={{ ...BC, fontSize: '1.05rem', fontWeight: 800, color: color.accentSoft }}>{h.value}</p>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── CONTACT ────────────────────────────────────────────────────── */}
        {data.contact && Object.values(data.contact).some(v => v) && (
          <Section title="Contact" icon={Mail} iconColor={color.inkMuted}>
            <div className="flex flex-wrap gap-3">
              {data.contact.email && <a href={`mailto:${data.contact.email}`} className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.82rem', color: color.inkDim }}><Mail className="h-3.5 w-3.5" />{data.contact.email}</a>}
              {data.contact.phone && <span style={{ ...B, fontSize: '0.82rem', color: color.inkDim }}>{data.contact.phone}</span>}
              {data.contact.instagram && <span className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.82rem', color: color.inkDim }}><Instagram className="h-3.5 w-3.5" />{data.contact.instagram}</span>}
              {data.contact.twitter && <span className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.82rem', color: color.inkDim }}><Twitter className="h-3.5 w-3.5" />{data.contact.twitter}</span>}
              {data.contact.hudlUrl && <a href={data.contact.hudlUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.82rem', color: color.accentSoft }}><Film className="h-3.5 w-3.5" />Hudl</a>}
              {data.contact.youtubeUrl && <a href={data.contact.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5" style={{ ...B, fontSize: '0.82rem', color: color.accentSoft }}><Film className="h-3.5 w-3.5" />Video</a>}
            </div>
          </Section>
        )}

        {/* ── TRUST LEGEND ──────────────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(37,43,77,0.2)', border: `1px solid ${color.border}` }}>
          <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.14em', color: color.inkMuted }} className="uppercase mb-3">How to read this profile</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TRUST_LEGEND.map(t => (
              <div key={t.key} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.color }} />
                <div>
                  <p style={{ ...B, fontSize: '0.72rem', fontWeight: 600, color: color.inkDim }}>{t.label}</p>
                  <p style={{ ...B, fontSize: '0.62rem', color: color.inkMuted }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-2 pb-8" style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }}>
          <TrendingUp className="h-3 w-3" /> Powered by PitchIQ — verified performance data, logged match by match.
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, iconColor, children }: { title: string; icon?: typeof Sparkles; iconColor?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4, ease }}
      className="rounded-2xl p-5 sm:p-6" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4 w-4" style={{ color: iconColor }} />}
        <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.16em', color: color.inkMuted }} className="uppercase">{title}</p>
      </div>
      {children}
    </motion.div>
  )
}
