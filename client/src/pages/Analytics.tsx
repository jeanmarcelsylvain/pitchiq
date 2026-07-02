/* ═══ Performance Intelligence ════════════════════════════════════════════
   The analytics room. Every section answers one of four questions: why did
   this happen, why is it changing, what should I improve, what should I
   focus on before my next match. Nothing here is decoration — every chart
   traces back to real logged match fields via src/lib/performanceIntel.ts. */
import { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { BarChart2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Widget, ProgressRing } from '@/components/widgets/Widget'
import { Counter } from '@/design/motion'
import { color, font, ease } from '@/design/tokens'
import { useCareerMatches } from '@/hooks/useCareerMatches'
import {
  buildDNA, classifyStyle, detectPatterns,
  projectDevelopment, buildConsistency, buildMomentum,
} from '@/lib/performanceIntel'
import { PerformanceDNA } from '@/components/analytics/PerformanceDNA'
import { PlayingStyleCard } from '@/components/analytics/PlayingStyle'
import { PositionPitch } from '@/components/analytics/PositionPitch'
import { InsightCards } from '@/components/analytics/InsightCards'
import { ShootingFunnel } from '@/components/analytics/ShootingFunnel'
import { MatchReplayStudio } from '@/components/analytics/MatchReplayStudio'
import { ReplaySelector } from '@/components/analytics/ReplaySelector'
import { ScopeSelector, type Scope } from '@/components/analytics/ScopeSelector'
import { ConsistencyEngine } from '@/components/analytics/ConsistencyEngine'
import { MomentumCard } from '@/components/analytics/MomentumCard'
import { FutureDevelopment } from '@/components/analytics/FutureDevelopment'
import { motion, AnimatePresence } from 'framer-motion'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

/* chart theme shared by every recharts instance on this page */
const gridStroke = 'rgba(37,43,77,0.6)'
const tickStyle = { fill: '#8a86a8', fontSize: 11 }
const tooltipStyle = { background: '#171c38', border: `1px solid ${color.border}`, borderRadius: 10, color: color.ink, fontSize: 12 }
/* shared X-axis config — preserveStartEnd + a tick gap keeps long career
   histories (hundreds of matches) from turning into an unreadable label
   smear, without needing per-chart tuning */
const dateAxisProps = { dataKey: 'date', tick: tickStyle, axisLine: false, tickLine: false, interval: 'preserveStartEnd' as const, minTickGap: 28 }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle} className="px-3 py-2 shadow-xl">
      <p style={{ ...B, color: color.inkMuted, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ ...B, color: color.ink, fontWeight: 600 }}>
          {p.name}: <span style={{ color: p.color ?? color.accent }}>{p.value}</span>
        </p>
      ))}
    </div>
  )
}

const sectionLabel = { ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const

export default function Analytics() {
  const navigate = useNavigate()
  const { seasons, careerMatches, currentSeasonMatches } = useCareerMatches()

  /* Scope defaults to the current season the first time an athlete has one;
     falls back to career if there's only archived history (e.g. right after
     an archive-and-reset). Every downstream calculation reads `matches`
     below — nothing computes off currentSeasonMatches directly. */
  const [scope, setScope] = useState<Scope>(() => currentSeasonMatches.length > 0 ? 'current' : 'career')
  const matches = useMemo(() => {
    if (scope === 'career') return careerMatches
    if (scope === 'current') return currentSeasonMatches
    return careerMatches.filter(m => m.seasonId === scope)
  }, [scope, careerMatches, currentSeasonMatches])

  const [replayId, setReplayId] = useState<string | null>(null)
  const [recentReplayIds, setRecentReplayIds] = useState<string[]>([])
  const selectReplay = (id: string) => {
    setReplayId(id)
    setRecentReplayIds(prev => [id, ...prev.filter(x => x !== id)].slice(0, 5))
  }

  const sorted = useMemo(() => [...matches].sort((a, b) => a.date.localeCompare(b.date)), [matches])

  const dna = useMemo(() => buildDNA(matches), [matches])
  const style = useMemo(() => classifyStyle(matches, dna), [matches, dna])
  const patterns = useMemo(() => detectPatterns(matches), [matches])
  const projections = useMemo(() => projectDevelopment(dna), [dna])
  const consistencyMetrics = useMemo(() => buildConsistency(matches), [matches])
  const momentum = useMemo(() => buildMomentum(matches), [matches])

  const replayMatch = useMemo(() => {
    if (careerMatches.length === 0) return null
    if (replayId) return careerMatches.find(m => m.id === replayId) ?? null
    return [...careerMatches].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  }, [careerMatches, replayId])

  const chartData = sorted.map(m => ({
    date: m.date.slice(5), rating: m.rating, goals: m.goals, assists: m.assists,
    passAcc: m.passAccuracy, distance: m.distanceCovered, speed: m.sprintSpeed,
  }))

  const overall = dna.length ? Math.round(dna.reduce((s, a) => s + a.value, 0) / dna.length) : 0
  const recentForm = sorted.slice(-5)
  const recentAvg = recentForm.length ? recentForm.reduce((s, m) => s + m.rating, 0) / recentForm.length : 0
  const seasonAvg = matches.length ? matches.reduce((s, m) => s + m.rating, 0) / matches.length : 0
  const formDelta = recentAvg - seasonAvg
  const consistency = dna.find(a => a.key === 'composure')?.value ?? 0

  const totalShots = matches.reduce((s, m) => s + m.shots, 0)
  const totalOnTarget = matches.reduce((s, m) => s + m.shotsOnTarget, 0)
  const totalGoals = matches.reduce((s, m) => s + m.goals, 0)
  const totalTackles = matches.reduce((s, m) => s + m.tackles, 0)
  const totalInterceptions = matches.reduce((s, m) => s + m.interceptions, 0)

  if (currentSeasonMatches.length === 0 && careerMatches.length === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <p style={sectionLabel} className="uppercase">Performance Intel</p>
          <h1 className="mt-1 text-2xl font-bold text-white">No data yet</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 mb-6">
            <BarChart2 className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your intelligence engine needs data</h2>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            Performance DNA, playing style, and pattern detection all build from your logged matches — current season or archived. Log your first one to switch this on.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/matches')}>
            <Plus className="h-4 w-4" /> Log a Match
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p style={sectionLabel} className="uppercase">Performance Intel</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Understand your game.</h1>
          <p className="mt-1 text-sm text-slate-500">
            Not statistics — intelligence, drawn from {matches.length} logged match{matches.length === 1 ? '' : 'es'}
            {scope === 'career' ? ' across your full career.' : '.'}
          </p>
        </div>
        <ScopeSelector seasons={seasons} scope={scope} onChange={setScope} />
      </div>

      {/* ── 1 · PERFORMANCE OVERVIEW ────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
        className="relative overflow-hidden rounded-2xl border border-slate-800/80 p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, rgba(23,28,56,0.9), rgba(10,13,28,0.95) 60%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-pitch-600/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p style={sectionLabel} className="uppercase mb-2">Overview</p>
            <h2 className="font-display text-2xl font-extrabold text-white">Overall Performance</h2>
            <div className="mt-5 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <p style={{ ...BC, fontSize: '1.5rem', fontWeight: 800, color: formDelta >= 0 ? color.emerald : color.warn }}>
                  {formDelta >= 0 ? '+' : ''}{formDelta.toFixed(1)}
                </p>
                <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>Current form vs. season</p>
              </div>
              <div>
                <p style={{ ...BC, fontSize: '1.5rem', fontWeight: 800, color: color.ink }}>{seasonAvg.toFixed(1)}</p>
                <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>Season avg rating</p>
              </div>
              <div>
                <p style={{ ...BC, fontSize: '1.5rem', fontWeight: 800, color: color.ink }}>{consistency.toFixed(0)}</p>
                <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>Consistency score</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 justify-self-center lg:justify-self-end">
            <ProgressRing value={overall} max={100} size={140} stroke={7}
              label={<span className="font-display text-4xl font-extrabold text-white stat-number"><Counter to={overall} /></span>}
              sub="overall" />
          </div>
        </div>
      </motion.section>

      {/* ── 2 · PERFORMANCE DNA ─────────────────────────────────────────── */}
      <Widget title="Performance DNA" badge={<Badge variant="info">Signature</Badge>}>
        <div className="px-5 pb-6 pt-2">
          <PerformanceDNA attributes={dna} />
        </div>
      </Widget>

      {/* ── 3 · PLAYING STYLE ────────────────────────────────────────────── */}
      {style && (
        <Widget title="Playing Style">
          <div className="px-5 pb-5">
            <PlayingStyleCard style={style} />
          </div>
        </Widget>
      )}

      {/* ── 4 · SEASON TRENDS ────────────────────────────────────────────── */}
      <Widget title="Season Trends" badge={<Badge variant="outline">{matches.length} matches</Badge>}>
        <div className="px-3 pb-4 pt-1">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis {...dateAxisProps} />
              <YAxis domain={[4, 10]} tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="rating" name="Rating" stroke={color.accent} fill="url(#ratingGrad)" strokeWidth={2.5}
                dot={{ r: 3.5, fill: color.accent, strokeWidth: 0 }} activeDot={{ r: 6 }}
                animationDuration={1200} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Widget>

      {/* ── 5 · POSITION INTELLIGENCE ────────────────────────────────────── */}
      <Widget title="Position Intelligence">
        <div className="px-5 pb-6 pt-2">
          <PositionPitch matches={matches} />
        </div>
      </Widget>

      {/* ── 6 · TECHNICAL ANALYSIS ───────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Widget title="Shooting Conversion">
          <div className="px-5 pb-5 pt-2">
            <ShootingFunnel shots={totalShots} onTarget={totalOnTarget} goals={totalGoals} />
          </div>
        </Widget>

        <Widget title="Passing Accuracy">
          <div className="px-3 pb-4 pt-1">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis {...dateAxisProps} />
                <YAxis domain={[40, 100]} tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="passAcc" name="Pass Acc %" stroke={color.ai} strokeWidth={2.5}
                  dot={{ r: 3, fill: color.ai, strokeWidth: 0 }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Widget>

        <Widget title="Defensive Actions" className="lg:col-span-2">
          <div className="px-5 pb-5 pt-2">
            <div className="grid grid-cols-2 gap-8 max-w-sm mb-1">
              <div>
                <p style={{ ...BC, fontSize: '2rem', fontWeight: 800, color: color.ink }}>{totalTackles}</p>
                <p style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }}>Tackles this season</p>
              </div>
              <div>
                <p style={{ ...BC, fontSize: '2rem', fontWeight: 800, color: color.ink }}>{totalInterceptions}</p>
                <p style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }}>Interceptions</p>
              </div>
            </div>
          </div>
          <div className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sorted.map(m => ({ date: m.date.slice(5), tackles: m.tackles, interceptions: m.interceptions }))}
                margin={{ top: 8, right: 12, left: -18, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis {...dateAxisProps} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="tackles" name="Tackles" fill={color.accent} radius={[3, 3, 0, 0]} animationDuration={1000} />
                <Bar dataKey="interceptions" name="Interceptions" fill={color.ai} radius={[3, 3, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Widget>
      </div>

      {/* ── 7 · PHYSICAL ANALYSIS ─────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Widget title="Distance Covered">
          <div className="px-3 pb-4 pt-1">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color.emerald} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={color.emerald} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis {...dateAxisProps} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="distance" name="Distance (km)" stroke={color.emerald} fill="url(#distGrad)" strokeWidth={2.5}
                  dot={{ r: 3, fill: color.emerald, strokeWidth: 0 }} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Widget>

        <Widget title="Sprint Speed">
          <div className="px-3 pb-4 pt-1">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="speedGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d9e" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#ff4d9e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis {...dateAxisProps} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#ff4d9e" fill="url(#speedGrad2)" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#ff4d9e', strokeWidth: 0 }} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Widget>
      </div>

      {/* ── 8 · AI PATTERN DETECTION ─────────────────────────────────────── */}
      {patterns.length > 0 && (
        <Widget title="AI Pattern Detection" badge={<Badge variant="info">{patterns.length} found</Badge>}>
          <div className="px-5 pb-5 pt-2">
            <InsightCards insights={patterns} />
          </div>
        </Widget>
      )}

      {/* ── 9 · IMPROVEMENT MOMENTUM ─────────────────────────────────────── */}
      {momentum && (
        <Widget title="Improvement Momentum">
          <div className="px-5 pb-5 pt-2">
            <MomentumCard momentum={momentum} />
          </div>
        </Widget>
      )}

      {/* ── 10 · CONSISTENCY ENGINE ──────────────────────────────────────── */}
      {consistencyMetrics.length > 0 && (
        <Widget title="Consistency Engine" badge={<Badge variant="outline">Volatility-based</Badge>}>
          <div className="px-5 pb-5 pt-2">
            <ConsistencyEngine metrics={consistencyMetrics} />
          </div>
        </Widget>
      )}

      {/* ── 11 · MATCH REPLAY STUDIO ─────────────────────────────────────── */}
      {replayMatch && (
        <Widget title="Match Replay Studio" badge={<Badge variant="outline">{careerMatches.length} matches available</Badge>}>
          <div className="px-5 pb-5 pt-2 space-y-5">
            <ReplaySelector matches={careerMatches} selectedId={replayMatch.id} onSelect={selectReplay} recentIds={recentReplayIds} />
            <AnimatePresence mode="wait">
              <motion.div key={replayMatch.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease }}>
                <MatchReplayStudio match={replayMatch} />
              </motion.div>
            </AnimatePresence>
          </div>
        </Widget>
      )}

      {/* ── 12 · FUTURE DEVELOPMENT ──────────────────────────────────────── */}
      {projections.length > 0 && (
        <Widget title="Future Development" to="/training" toLabel="Build training plan">
          <div className="px-5 pb-5 pt-2">
            <FutureDevelopment projections={projections} />
          </div>
        </Widget>
      )}
    </div>
  )
}
