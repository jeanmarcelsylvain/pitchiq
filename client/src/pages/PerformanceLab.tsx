/* ═══ Performance Lab ═════════════════════════════════════════════════════
   The AI workspace — not a chatbot, a complete performance department.
   Every module runs on the athlete's own logged data through the shared
   evidence/confidence engine (src/lib/aiTrust.ts). Performance Coach (the
   existing self-assessment + chat experience) is preserved unchanged and
   embedded as one module among several new, data-driven ones. */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Dna, Compass, HeartPulse, FileText, TrendingUp,
  MessageSquare, Dumbbell, ArrowUpRight, Film,
} from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { Counter } from '@/design/motion'
import { useCareerMatches } from '@/hooks/useCareerMatches'
import { useAppData } from '@/hooks/useAppData'
import { buildDNA, DNA_LABELS } from '@/lib/performanceIntel'
import { computeDataCoverage, missingDataTips, transparencyLine, type ConfidenceLevel } from '@/lib/aiTrust'
import { buildTacticalAnalysis, buildRecoveryAdvice, buildSeasonReview, buildMatchBreakdownEvidence, buildProjectionEvidence } from '@/lib/labModules'
import { DataCoverageCard } from '@/components/lab/DataCoverageCard'
import { EvidencePanel } from '@/components/lab/EvidencePanel'
import { QualityBadge } from '@/components/lab/ConfidenceBadge'
import AICoachChat from './AICoach'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

const MODULES = [
  { id: 'coach', label: 'Performance Coach', icon: MessageSquare, accent: '#ff5a3c' },
  { id: 'breakdown', label: 'Match Breakdown', icon: Film, accent: '#4d9fff' },
  { id: 'dna', label: 'Performance DNA', icon: Dna, accent: '#a78bfa' },
  { id: 'tactical', label: 'Tactical Analyst', icon: Compass, accent: '#2dd4a0' },
  { id: 'recovery', label: 'Recovery Advisor', icon: HeartPulse, accent: '#ff4d9e' },
  { id: 'season', label: 'Season Review', icon: FileText, accent: '#ffba08' },
  { id: 'projection', label: 'Future Projection', icon: TrendingUp, accent: '#ff5a3c' },
] as const
type ModuleId = typeof MODULES[number]['id'] | 'home'

const sectionLabel = { ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const

export default function PerformanceLab() {
  const navigate = useNavigate()
  const { careerMatches } = useCareerMatches()
  const { profile } = useAppData()
  const [active, setActive] = useState<ModuleId>('home')

  const dna = useMemo(() => buildDNA(careerMatches), [careerMatches])
  const coverage = useMemo(() => computeDataCoverage(careerMatches), [careerMatches])
  const tips = useMemo(() => missingDataTips(coverage, careerMatches), [coverage, careerMatches])
  const weakest = dna.length ? [...dna].sort((a, b) => a.value - b.value)[0] : null

  const sorted = [...careerMatches].sort((a, b) => b.date.localeCompare(a.date))
  const lastMatch = sorted[0] ?? null

  if (careerMatches.length === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <p style={sectionLabel} className="uppercase">Performance Lab</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Your AI performance department.</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 mb-6">
            <Sparkles className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Every module here reads your logged matches</h2>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            Log your first match and this becomes a working AI workspace — tactical patterns, recovery guidance, season reviews, all built from your own data.
          </p>
          <button onClick={() => navigate('/matches')} className="rounded-lg px-5 py-2.5 text-sm font-bold" style={{ ...BC, background: color.accent, color: color.bg }}>
            Log Your First Match
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p style={sectionLabel} className="uppercase">Performance Lab</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Your AI performance department.</h1>
          <p className="mt-1 text-sm text-slate-500">{transparencyLine(careerMatches, 'across your full career')}</p>
        </div>
      </div>

      {/* module nav */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <ModuleTab id="home" active={active} onClick={setActive} label="Lab Home" icon={Sparkles} accent={color.accent} />
        {MODULES.map(m => <ModuleTab key={m.id} id={m.id} active={active} onClick={setActive} label={m.label} icon={m.icon} accent={m.accent} />)}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }}>
          {active === 'home' && (
            <LabHome
              profile={profile} weakest={weakest} lastMatch={lastMatch} coverage={coverage} tips={tips}
              matchCount={careerMatches.length}
              onNavigate={setActive}
            />
          )}
          {active === 'coach' && <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color.border}` }}><AICoachChat /></div>}
          {active === 'breakdown' && <MatchBreakdownModule matches={sorted} />}
          {active === 'dna' && <DNAModule dna={dna} matches={careerMatches} />}
          {active === 'tactical' && <TacticalModule matches={careerMatches} />}
          {active === 'recovery' && <RecoveryModule matches={careerMatches} />}
          {active === 'season' && <SeasonReviewModule matches={careerMatches} />}
          {active === 'projection' && <ProjectionModule dna={dna} matches={careerMatches} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function ModuleTab({ id, active, onClick, label, icon: Icon, accent }: {
  id: ModuleId; active: ModuleId; onClick: (id: ModuleId) => void; label: string; icon: typeof Sparkles; accent: string
}) {
  const isActive = id === active
  return (
    <button onClick={() => onClick(id)} aria-pressed={isActive}
      className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
      style={{ ...BC, background: isActive ? `${accent}18` : color.surface, color: isActive ? accent : color.inkMuted, border: `1px solid ${isActive ? `${accent}50` : color.border}` }}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )
}

/* ── Lab Home ──────────────────────────────────────────────────────────────── */
function LabHome({ profile, weakest, lastMatch, coverage, tips, matchCount, onNavigate }: any) {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, rgba(23,28,56,0.9), rgba(10,13,28,0.95) 60%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-pitch-600/10 blur-3xl" />
        <p style={sectionLabel} className="uppercase mb-2">Welcome back{profile.name ? `, ${profile.name.split(' ')[0]}` : ''}</p>
        <h2 className="font-display text-2xl font-extrabold text-white max-w-lg">
          {weakest ? `Today's focus: ${DNA_LABELS[weakest.key as keyof typeof DNA_LABELS]}.` : 'Your performance department is ready.'}
        </h2>
        {weakest && (
          <p style={{ ...B, fontSize: '0.85rem', color: color.inkDim }} className="mt-2 max-w-lg">{weakest.improve}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <QuickAction label="Analyze Last Match" icon={Film} onClick={() => onNavigate('breakdown')} />
          <QuickAction label="Ask Performance Coach" icon={MessageSquare} onClick={() => onNavigate('coach')} />
          <QuickAction label="Generate Weekly Training" icon={Dumbbell} onClick={() => navigate('/training')} />
          <QuickAction label="Review Performance DNA" icon={Dna} onClick={() => onNavigate('dna')} />
          <QuickAction label="Create Season Review" icon={FileText} onClick={() => onNavigate('season')} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
        <DataCoverageCard coverage={coverage} tips={tips} />
        <div className="rounded-xl p-5 space-y-3" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
          <p style={sectionLabel} className="uppercase">Latest AI Discovery</p>
          {lastMatch ? (
            <>
              <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.ink }}>vs {lastMatch.opponent} — {lastMatch.rating.toFixed(1)} rating</p>
              <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.5 }}>
                Most recently logged match. Open Match Breakdown for a full AI report with evidence.
              </p>
              <button onClick={() => onNavigate('breakdown')} className="flex items-center gap-1 text-xs font-semibold" style={{ ...BC, color: color.accentSoft }}>
                Open Match Breakdown <ArrowUpRight className="h-3 w-3" />
              </button>
            </>
          ) : <p style={{ ...B, fontSize: '0.82rem', color: color.inkMuted }}>Log a match to unlock this.</p>}
        </div>
      </div>
    </div>
  )
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Film; onClick: () => void }) {
  return (
    <motion.button whileHover={{ y: -2 }} onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors"
      style={{ ...BC, background: color.surface, color: color.inkDim, border: `1px solid ${color.border}` }}>
      <Icon className="h-3.5 w-3.5" style={{ color: color.accentSoft }} /> {label}
    </motion.button>
  )
}

/* ── Match Breakdown module ───────────────────────────────────────────────── */
function MatchBreakdownModule({ matches }: { matches: import('@/types').Match[] }) {
  const [selectedId, setSelectedId] = useState(matches[0]?.id)
  const match = matches.find(m => m.id === selectedId) ?? matches[0]
  const prior = matches.filter(m => m.id !== match?.id && m.date <= (match?.date ?? ''))
  if (!match) return null
  const evidence = buildMatchBreakdownEvidence(match, prior)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {matches.slice(0, 10).map(m => (
          <button key={m.id} onClick={() => setSelectedId(m.id)} aria-pressed={m.id === match.id}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ ...BC, background: m.id === match.id ? color.accent : color.surface, color: m.id === match.id ? color.bg : color.inkMuted, border: `1px solid ${m.id === match.id ? color.accent : color.border}` }}>
            vs {m.opponent}
          </button>
        ))}
      </div>
      <div className="rounded-xl p-5" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ ...BC, fontSize: '1.15rem', fontWeight: 800, color: color.ink }}>vs {match.opponent}</p>
            <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted }}>{match.date} · {match.position} · Rating {match.rating.toFixed(1)}</p>
          </div>
          <QualityBadge quality={evidence.confidence === 'insufficient' || evidence.confidence === 'limited' ? 'limited_data' : 'evidence_based'} />
        </div>
        <div className="space-y-2 mb-4">
          {evidence.primary.map((l, i) => <p key={i} style={{ ...B, fontSize: '0.82rem', color: color.inkDim, lineHeight: 1.55 }}>• {l}</p>)}
          {evidence.supporting.map((l, i) => <p key={i} style={{ ...B, fontSize: '0.82rem', color: color.warn, lineHeight: 1.55 }}>• {l}</p>)}
        </div>
        <EvidencePanel evidence={evidence} />
      </div>
    </div>
  )
}

/* ── Performance DNA module ───────────────────────────────────────────────── */
function DNAModule({ dna, matches }: { dna: import('@/lib/performanceIntel').DNAAttribute[]; matches: import('@/types').Match[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {dna.map(attr => {
        const confidence: ConfidenceLevel = matches.length < 3 ? 'insufficient' : matches.length < 6 ? 'limited' : matches.length < 12 ? 'moderate' : 'high'
        return (
          <div key={attr.key} className="rounded-xl p-4" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ ...BC, fontSize: '0.9rem', fontWeight: 700, color: color.ink }}>{attr.label}</p>
              <p style={{ ...BC, fontSize: '1.3rem', fontWeight: 800, color: color.accentSoft }}>{attr.value.toFixed(0)}</p>
            </div>
            <p style={{ ...B, fontSize: '0.78rem', color: color.inkDim, lineHeight: 1.5 }} className="mb-3">{attr.explain}</p>
            <EvidencePanel evidence={{
              primary: [attr.explain],
              supporting: [`Trend: ${attr.trend > 0 ? '+' : ''}${attr.trend.toFixed(1)} over last 5 matches`],
              historicalContext: [`Based on ${attr.matches} logged matches.`],
              confidence,
              dataCoverage: `${attr.matches} matches`,
              nextStep: attr.improve,
            }} />
          </div>
        )
      })}
    </div>
  )
}

/* ── Tactical Analyst module ──────────────────────────────────────────────── */
function TacticalModule({ matches }: { matches: import('@/types').Match[] }) {
  const insights = buildTacticalAnalysis(matches)
  if (insights.length === 0) {
    return <EmptyModule text="Not enough variation in your logged matches yet to detect tactical patterns. Keep logging — patterns emerge after several matches." />
  }
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {insights.map((ins, i) => (
        <div key={i} className="rounded-xl p-4" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <p style={{ ...BC, fontSize: '0.92rem', fontWeight: 700, color: color.ink }}>{ins.title}</p>
            <QualityBadge quality={ins.quality} />
          </div>
          <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.55 }} className="mb-3">{ins.body}</p>
          <EvidencePanel evidence={ins.evidence} />
        </div>
      ))}
    </div>
  )
}

/* ── Recovery Advisor module ──────────────────────────────────────────────── */
function RecoveryModule({ matches }: { matches: import('@/types').Match[] }) {
  const advice = buildRecoveryAdvice(matches)
  return (
    <div className="rounded-xl p-5 max-w-xl" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <HeartPulse className="h-4 w-4" style={{ color: '#ff4d9e' }} />
        <p style={sectionLabel} className="uppercase">Recovery Recommendation</p>
      </div>
      <p style={{ ...BC, fontSize: '1.1rem', fontWeight: 700, color: color.ink, lineHeight: 1.4 }} className="mb-2">{advice.recommendation}</p>
      <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }} className="mb-4">{advice.rationale}</p>
      <QualityBadge quality={advice.quality} />
      <div className="mt-4"><EvidencePanel evidence={advice.evidence} /></div>
    </div>
  )
}

/* ── Season Review module ─────────────────────────────────────────────────── */
function SeasonReviewModule({ matches }: { matches: import('@/types').Match[] }) {
  const review = buildSeasonReview(matches)
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-6" style={{ background: 'linear-gradient(150deg, rgba(23,28,56,0.9), rgba(10,13,28,0.95))', border: `1px solid ${color.border}` }}>
        <p style={sectionLabel} className="uppercase mb-2">End-of-Season Report</p>
        <div className="grid grid-cols-3 gap-4">
          <div><p style={{ ...BC, fontSize: '1.8rem', fontWeight: 800, color: color.ink }}><Counter to={review.matchCount} /></p><p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>Matches</p></div>
          <div><p style={{ ...BC, fontSize: '1.8rem', fontWeight: 800, color: color.accentSoft }}>{review.avgRating.toFixed(1)}</p><p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>Avg Rating</p></div>
          <div><p style={{ ...BC, fontSize: '1.8rem', fontWeight: 800, color: color.emerald }}>{review.consistency.toFixed(0)}</p><p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>Consistency</p></div>
        </div>
      </div>

      {review.momentum && (
        <div className="rounded-xl p-4" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
          <p style={sectionLabel} className="uppercase mb-1">Playing Style Evolution</p>
          <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.ink }}>{review.momentum.label}</p>
          <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim }} className="mt-1">{review.momentum.description}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {review.biggestImprovement && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(45,212,160,0.06)', border: '1px solid rgba(45,212,160,0.2)' }}>
            <p style={{ ...BC, fontSize: '0.65rem', color: color.emerald, letterSpacing: '0.1em' }} className="uppercase mb-1">Biggest Improvement</p>
            <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.ink }}>{DNA_LABELS[review.biggestImprovement.key]}</p>
          </div>
        )}
        {review.needsWork && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,90,60,0.06)', border: '1px solid rgba(255,90,60,0.2)' }}>
            <p style={{ ...BC, fontSize: '0.65rem', color: color.accentSoft, letterSpacing: '0.1em' }} className="uppercase mb-1">Needs Work</p>
            <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.ink }}>{DNA_LABELS[review.needsWork.key]}</p>
          </div>
        )}
      </div>

      {review.bestPerformance && (
        <div className="rounded-xl p-4" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
          <p style={sectionLabel} className="uppercase mb-1">Best Performance</p>
          <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.ink }}>vs {review.bestPerformance.opponent} — {review.bestPerformance.rating.toFixed(1)}</p>
        </div>
      )}
    </div>
  )
}

/* ── Future Projection module ─────────────────────────────────────────────── */
function ProjectionModule({ dna, matches }: { dna: import('@/lib/performanceIntel').DNAAttribute[]; matches: import('@/types').Match[] }) {
  const projections = buildProjectionEvidence(dna, matches)
  if (projections.length === 0) return <EmptyModule text="Log a few more matches to unlock trend-based projections." />
  return (
    <div className="space-y-4">
      <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }}>Projections are estimates based on your recent trend, not guarantees — every one includes a confidence range that tightens as you log more matches.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {projections.map(p => (
          <div key={p.key} className="rounded-xl p-4" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ ...BC, fontSize: '0.9rem', fontWeight: 700, color: color.ink }}>{p.label}</p>
              <p style={{ ...BC, fontSize: '1.2rem', fontWeight: 800, color: color.accentSoft }}>~{p.projected.toFixed(0)}</p>
            </div>
            <p style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }} className="mb-3">Range: {p.low.toFixed(0)}–{p.high.toFixed(0)}</p>
            <EvidencePanel evidence={p.evidence} />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyModule({ text }: { text: string }) {
  return <div className="rounded-xl p-8 text-center" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
    <p style={{ ...B, fontSize: '0.85rem', color: color.inkMuted }}>{text}</p>
  </div>
}
