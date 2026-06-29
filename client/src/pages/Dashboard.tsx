import { Activity, Zap, Target, Clock, TrendingUp, Star, MapPin, Award, Plus } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { useAppData } from '@/hooks/useAppData'
import { formatDate, formatDistance, getResultBadge, getRatingColor, getPositionColor } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

const insightTypeConfig = {
  improvement: { color: 'text-pitch-400', bg: 'bg-pitch-500/10 border-pitch-500/20', dot: 'bg-pitch-400' },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
  achievement: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400' },
  trend: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
}

export default function Dashboard() {
  const { matches, goals, insights, seasonStats, profile, isDemo } = useAppData()
  const navigate = useNavigate()

  const ratingData = matches
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({ date: m.date.slice(5), rating: m.rating, goals: m.goals }))

  const recentMatches = matches.slice(0, 5)
  const activeGoals = goals.filter(g => !g.completed).slice(0, 3)
  const unreadInsights = insights.filter(i => !i.read)

  if (!isDemo && matches.length === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome, {profile.name}!</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pitch-600/20 mb-6">
            <Activity className="h-8 w-8 text-pitch-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Log your first match</h2>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            Your dashboard will fill up with stats, charts, and insights after you log your first match. Takes less than 60 seconds.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/matches')}>
            <Plus className="h-4 w-4" /> Log a Match
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile.name} · {profile.primaryPosition} {profile.club ? `· ${profile.club}` : ''}
        </p>
      </div>

      {/* KPI Cards */}
      <div data-tour="stat-cards" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Season Goals"
          value={seasonStats.goals}
          subtext={`${seasonStats.goalsPerGame.toFixed(2)} per game`}
          icon={<Target className="h-5 w-5" />}
          trend={12.5}
          color="green"
        />
        <StatCard
          label="Assists"
          value={seasonStats.assists}
          subtext={`${seasonStats.assistsPerGame.toFixed(2)} per game`}
          icon={<Star className="h-5 w-5" />}
          trend={8.3}
          color="blue"
        />
        <StatCard
          label="Avg Rating"
          value={`${seasonStats.avgRating.toFixed(1)}/10`}
          subtext={`${seasonStats.matches} matches`}
          icon={<Activity className="h-5 w-5" />}
          trend={5.2}
          color="yellow"
        />
        <StatCard
          label="Sprint Speed"
          value={`${seasonStats.avgSprintSpeed} km/h`}
          subtext="season average"
          icon={<Zap className="h-5 w-5" />}
          trend={6.3}
          color="purple"
        />
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Minutes Played" value={seasonStats.minutesPlayed.toLocaleString()} subtext="this season" icon={<Clock className="h-5 w-5" />} color="slate" />
        <StatCard label="Pass Accuracy" value={`${seasonStats.avgPassAccuracy}%`} subtext="season average" icon={<TrendingUp className="h-5 w-5" />} color="green" />
        <StatCard label="Distance" value={formatDistance(seasonStats.totalDistance)} subtext="total covered" icon={<MapPin className="h-5 w-5" />} color="blue" />
        <StatCard label="Training Sessions" value={seasonStats.trainingSessions} subtext="this season" icon={<Award className="h-5 w-5" />} color="yellow" />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rating chart */}
        <div data-tour="rating-chart" className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Performance Rating Trend</CardTitle>
              <Badge variant="info">Last 8 Matches</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ratingData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d1530" />
                  <XAxis dataKey="date" tick={{ fill: '#5c4888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[4, 10]} tick={{ fill: '#5c4888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#120c22', border: '1px solid #1d1530', borderRadius: '8px', color: '#e0d5f0', fontSize: '12px' }}
                    cursor={{ stroke: '#3c3050' }}
                  />
                  <Line type="monotone" dataKey="rating" stroke="#ff5a3c" strokeWidth={2.5} dot={{ r: 4, fill: '#ff5a3c', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <div data-tour="insights">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Insights</CardTitle>
              {unreadInsights.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pitch-600 text-xs font-bold text-white">
                  {unreadInsights.length}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              {insights.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Insights appear after you log a few matches.</p>
              ) : insights.slice(0, 4).map(insight => {
                const cfg = insightTypeConfig[insight.type]
                return (
                  <div key={insight.id} className={`rounded-lg border p-3 ${cfg.bg}`}>
                    <div className="flex items-start gap-2">
                      <div className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
                      <div>
                        <p className={`text-xs font-semibold ${cfg.color}`}>{insight.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{insight.body}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Matches</CardTitle>
            <Badge variant="outline">{seasonStats.matches} total</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800">
              {recentMatches.map(match => {
                const result = getResultBadge(match.result)
                return (
                  <div key={match.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-800/30 transition-colors">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${result.className}`}>
                      {result.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">vs {match.opponent}</p>
                      <p className="text-xs text-slate-500">{formatDate(match.date)} · {match.competition}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${getRatingColor(match.rating)}`}>{match.rating.toFixed(1)}</p>
                      <p className="text-xs text-slate-500">{match.goals}G {match.assists}A</p>
                    </div>
                    <Badge className={getPositionColor(match.position)} variant="outline">{match.position}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Goals progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Season Goals</CardTitle>
            <Badge variant="success">{activeGoals.length} active</Badge>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {activeGoals.map(goal => {
              const pct = Math.min(100, (goal.currentValue / goal.targetValue) * 100)
              const colorMap: Record<string, 'green' | 'blue' | 'yellow' | 'purple'> = {
                scoring: 'green', passing: 'blue', fitness: 'yellow', training: 'purple', minutes: 'blue', custom: 'green',
              }
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-200">{goal.title}</p>
                    <p className="text-xs font-mono text-slate-400">{goal.currentValue} / {goal.targetValue} {goal.unit}</p>
                  </div>
                  <ProgressBar value={goal.currentValue} max={goal.targetValue} color={colorMap[goal.category] ?? 'green'} size="md" />
                  <p className="mt-1 text-right text-xs text-slate-600">{pct.toFixed(0)}% complete</p>
                </div>
              )
            })}
            {goals.length > 3 && (
              <p className="text-xs text-slate-600 text-center pt-1">+{goals.length - 3} more goals → Goals page</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
