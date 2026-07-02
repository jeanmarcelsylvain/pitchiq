/* ═══ PLAYER HQ — the athlete's command center ═══════════════════════════════
   Answers four questions the moment it loads:
   How am I performing? (hero + performance score)
   How am I improving?  (form delta, trend chart, goals)
   What should I do next? (daily briefing + quick actions)
   How do I present myself? (recruit profile action, trophy room)
   All numbers are derived from logged match data — nothing invented. */
import { Activity, Zap, Target, TrendingUp, Star, Plus, Sparkles, Dumbbell, FileText, Flame, Trophy } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Widget, ProgressRing, ActionCard } from '@/components/widgets/Widget'
import { Counter } from '@/design/motion'
import { ease } from '@/design/tokens'
import { useAppData } from '@/hooks/useAppData'
import { formatDate, getResultBadge, getRatingColor, getPositionColor } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

const insightTypeConfig = {
  improvement: { color: 'text-pitch-400', bg: 'bg-pitch-500/10 border-pitch-500/20', dot: 'bg-pitch-400' },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
  achievement: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400' },
  trend: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { matches, goals, insights, seasonStats, profile, isDemo } = useAppData()
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  /* ── derived intelligence (all from real logged data) ─────────────────── */
  const byDateDesc = matches.slice().sort((a, b) => b.date.localeCompare(a.date))
  const last5 = byDateDesc.slice(0, 5)
  const formDelta = last5.length
    ? last5.reduce((s, m) => s + m.rating, 0) / last5.length - seasonStats.avgRating
    : 0

  let streak = 0
  for (const m of byDateDesc) {
    if (m.rating >= seasonStats.avgRating) streak++
    else break
  }

  /* composite performance score (0–100) + supporting pillars */
  const pillars = [
    { label: 'Technical', value: Math.round(seasonStats.avgPassAccuracy) },
    { label: 'Physical', value: Math.round(Math.min(1, seasonStats.avgSprintSpeed / 33) * 100) },
    { label: 'Scoring', value: Math.round(Math.min(1, seasonStats.goalsPerGame / 1) * 100) },
    {
      label: 'Consistency',
      value: matches.length > 1
        ? Math.round(Math.max(0, 100 - Math.sqrt(matches.reduce((s, m) => s + (m.rating - seasonStats.avgRating) ** 2, 0) / matches.length) * 28))
        : 0,
    },
  ]
  const perfScore = Math.round(
    (seasonStats.avgRating / 10) * 100 * 0.55 + pillars.reduce((s, p) => s + p.value, 0) / pillars.length * 0.45
  )

  /* daily briefing — heuristics over the athlete's own numbers */
  const posAvg = new Map<string, { sum: number; n: number }>()
  matches.forEach(m => {
    const e = posAvg.get(m.position) ?? { sum: 0, n: 0 }
    posAvg.set(m.position, { sum: e.sum + m.rating, n: e.n + 1 })
  })
  const bestPos = [...posAvg.entries()]
    .filter(([, v]) => v.n >= 2)
    .sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n)[0]
  const briefing = [
    formDelta >= 0
      ? `Your last five matches average ${formDelta.toFixed(1)} above your season rating — form is climbing.`
      : `Your last five matches dipped ${Math.abs(formDelta).toFixed(1)} below season average. Worth reviewing what changed.`,
    bestPos && `Your strongest performances come at ${bestPos[0]} — ${(bestPos[1].sum / bestPos[1].n).toFixed(1)} average across ${bestPos[1].n} matches.`,
    seasonStats.goalsPerGame >= 0.5
      ? `You're contributing ${seasonStats.goalsPerGame.toFixed(2)} goals per game. Keep feeding that.`
      : `Pass accuracy is holding at ${seasonStats.avgPassAccuracy}% — your platform for everything else.`,
  ].filter(Boolean) as string[]

  /* personal records for the trophy shelf */
  const bestMatch = byDateDesc.slice().sort((a, b) => b.rating - a.rating)[0]
  const mostGoals = byDateDesc.slice().sort((a, b) => b.goals - a.goals)[0]
  const records = [
    bestMatch && { icon: Star, label: 'Best rating', value: bestMatch.rating.toFixed(1), sub: `vs ${bestMatch.opponent}` },
    mostGoals && mostGoals.goals > 0 && { icon: Target, label: 'Most goals', value: `${mostGoals.goals}`, sub: `vs ${mostGoals.opponent}` },
    { icon: Flame, label: 'Form streak', value: `${streak}`, sub: 'matches above average' },
  ].filter(Boolean) as { icon: typeof Star; label: string; value: string; sub: string }[]

  const ratingData = matches.slice().sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({ date: m.date.slice(5), rating: m.rating }))
  const recentMatches = byDateDesc.slice(0, 5)
  const activeGoals = goals.filter(g => !g.completed).slice(0, 3)
  const unreadInsights = insights.filter(i => !i.read)
  const firstName = profile.name.split(' ')[0]

  /* ── empty state — first match not logged yet ─────────────────────────── */
  if (!isDemo && matches.length === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch-500">Player HQ</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{greeting()}, {firstName}.</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pitch-600/20 mb-6">
            <Activity className="h-8 w-8 text-pitch-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your HQ is waiting for its first match</h2>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            Performance score, form, briefings, and records all build from your match log. The first entry takes less than 60 seconds.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/matches')}>
            <Plus className="h-4 w-4" /> Log your first match
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-slide-up">

      {/* ── HERO PANEL — who you are right now ─────────────────────────────── */}
      <motion.section
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        data-tour="stat-cards"
        className="relative overflow-hidden rounded-2xl border border-slate-800/80 p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, rgba(23,28,56,0.9), rgba(10,13,28,0.95) 60%)' }}
      >
        {/* environmental lighting */}
        <div aria-hidden className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-pitch-600/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-10 h-64 w-72 rounded-full bg-blue-500/[0.06] blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch-500">Player HQ</p>
            <h1 className="mt-2 font-display text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              {greeting()}, {firstName}.
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {profile.primaryPosition}{profile.club ? ` · ${profile.club}` : ''} · {seasonStats.matches} matches this season
            </p>

            {/* form + streak chips */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                formDelta >= 0 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
              }`}>
                <TrendingUp className="h-3 w-3" />
                Form {formDelta >= 0 ? '+' : ''}{formDelta.toFixed(1)} vs season
              </span>
              {streak > 1 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pitch-600/30 bg-pitch-600/10 px-3 py-1 text-xs font-semibold text-pitch-400">
                  <Flame className="h-3 w-3" /> {streak}-match streak above average
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-400">
                {seasonStats.goals}G · {seasonStats.assists}A · {seasonStats.avgPassAccuracy}% pass
              </span>
            </div>

            {/* pillar bars */}
            <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 max-w-md">
              {pillars.map((p, i) => (
                <div key={p.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{p.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">{p.value}</span>
                  </div>
                  <div className="h-[3px] rounded-full bg-slate-800">
                    <motion.div className="h-full rounded-full bg-pitch-500"
                      initial={{ width: 0 }} animate={{ width: `${p.value}%` }}
                      transition={{ duration: 1, delay: 0.4 + i * 0.1, ease }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* performance score ring */}
          <div className="flex flex-col items-center gap-2 justify-self-center lg:justify-self-end">
            <ProgressRing
              value={perfScore} max={100} size={148} stroke={7}
              label={
                <span className="font-display text-5xl font-extrabold text-white stat-number">
                  <Counter to={perfScore} />
                </span>
              }
              sub="overall"
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Performance Score</p>
          </div>
        </div>
      </motion.section>

      {/* ── QUICK ACTIONS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActionCard accent icon={<Plus className="h-4.5 w-4.5" size={18} />} title="Log Match"
          sub="60 seconds, full record" onClick={() => navigate('/matches')} />
        <ActionCard ai icon={<Sparkles size={18} />} title="AI Analysis"
          sub="Ask the coach anything" onClick={() => navigate('/ai-coach')} />
        <ActionCard ai icon={<Dumbbell size={18} />} title="Training Plan"
          sub="Built from your weakness" onClick={() => navigate('/training')} />
        <ActionCard icon={<FileText size={18} />} title="Recruit Profile"
          sub="Share with scouts" onClick={() => navigate('/recruit')} />
      </div>

      {/* ── MAIN GRID — trend chart + daily briefing ───────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Widget title="Rating Trend" tour="rating-chart" to="/analytics" toLabel="Performance Intel"
          badge={<Badge variant="info">Season</Badge>} className="lg:col-span-2">
          <div className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={ratingData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,43,77,0.6)" />
                <XAxis dataKey="date" tick={{ fill: '#8a86a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[4, 10]} tick={{ fill: '#8a86a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#10142a', border: '1px solid #252b4d', borderRadius: '10px', color: '#e2e0f0', fontSize: '12px' }}
                  cursor={{ stroke: '#38406e' }}
                />
                <Line type="monotone" dataKey="rating" stroke="#ff5a3c" strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#ff5a3c', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Widget>

        <Widget title="Daily Briefing" tour="insights" to="/ai-coach" toLabel="Full analysis"
          badge={unreadInsights.length > 0 ? (
            <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-pitch-600 px-1 text-[10px] font-bold text-white">{unreadInsights.length}</span>
          ) : undefined}>
          <div className="px-5 pb-5 space-y-4">
            {briefing.map((line, i) => (
              <motion.div key={i} className="flex gap-3"
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease }}>
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <p className="text-[13px] leading-relaxed text-slate-300">{line}</p>
              </motion.div>
            ))}
            {insights.slice(0, 2).map(insight => {
              const cfg = insightTypeConfig[insight.type]
              return (
                <div key={insight.id} className={`rounded-lg border p-3 ${cfg.bg}`}>
                  <p className={`text-xs font-semibold ${cfg.color}`}>{insight.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{insight.body}</p>
                </div>
              )
            })}
          </div>
        </Widget>
      </div>

      {/* ── SECOND GRID — match journal + goals ────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Widget title="Match Journal" to="/matches" badge={<Badge variant="outline">{seasonStats.matches} total</Badge>}>
          <div className="divide-y divide-slate-800/70">
            {recentMatches.map((match, i) => {
              const result = getResultBadge(match.result)
              return (
                <motion.button key={match.id} onClick={() => navigate('/matches')}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease }}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-slate-800/30 transition-colors">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${result.className}`}>
                    {result.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">vs {match.opponent}</p>
                    <p className="text-xs text-slate-500">{formatDate(match.date)} · {match.competition}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold stat-number ${getRatingColor(match.rating)}`}>{match.rating.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">{match.goals}G {match.assists}A</p>
                  </div>
                  <Badge className={getPositionColor(match.position)} variant="outline">{match.position}</Badge>
                </motion.button>
              )
            })}
          </div>
        </Widget>

        <Widget title="Season Goals" to="/goals" badge={<Badge variant="success">{activeGoals.length} active</Badge>}>
          <div className="px-5 pb-5 pt-1 space-y-5">
            {activeGoals.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-500">No active goals — set one to give the season a target.</p>
            )}
            {activeGoals.map(goal => {
              const pct = Math.min(100, (goal.currentValue / goal.targetValue) * 100)
              return (
                <div key={goal.id} className="flex items-center gap-4">
                  <ProgressRing value={goal.currentValue} max={goal.targetValue} size={54} stroke={4}
                    label={<span className="text-[11px] font-bold text-slate-200 stat-number">{pct.toFixed(0)}%</span>} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{goal.title}</p>
                    <p className="mt-0.5 text-xs font-mono text-slate-500">{goal.currentValue} / {goal.targetValue} {goal.unit}</p>
                  </div>
                </div>
              )
            })}
            {goals.length > 3 && (
              <p className="text-center text-xs text-slate-600">+{goals.length - 3} more in Goals</p>
            )}
          </div>
        </Widget>
      </div>

      {/* ── TROPHY SHELF — personal records ────────────────────────────────── */}
      <Widget title="Trophy Room" to="/achievements" toLabel="Open cabinet" badge={<Trophy className="h-3.5 w-3.5 text-yellow-500/80" />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 pb-5">
          {records.map(({ icon: Icon, label, value, sub }, i) => (
            <motion.div key={label}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-800/40 to-slate-900/60 p-4">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-500/25 to-transparent" />
              <Icon className="h-4 w-4 text-yellow-500/80 mb-3" aria-hidden />
              <p className="font-display text-2xl font-extrabold text-white stat-number leading-none">{value}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-300">{label}</p>
              <p className="text-[10px] text-slate-500">{sub}</p>
            </motion.div>
          ))}
        </div>
      </Widget>
    </div>
  )
}
