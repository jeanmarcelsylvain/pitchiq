import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppData } from '@/hooks/useAppData'
import { useNavigate } from 'react-router-dom'
import { BarChart2, Plus } from 'lucide-react'

type MetricKey = 'goals' | 'assists' | 'passAcc' | 'rating' | 'speed' | 'distance'

const metrics: { key: MetricKey; label: string; color: string }[] = [
  { key: 'goals', label: 'Goals', color: '#22c55e' },
  { key: 'assists', label: 'Assists', color: '#3b82f6' },
  { key: 'passAcc', label: 'Pass Accuracy', color: '#a855f7' },
  { key: 'rating', label: 'Performance Rating', color: '#f59e0b' },
  { key: 'speed', label: 'Sprint Speed', color: '#ec4899' },
  { key: 'distance', label: 'Distance Covered', color: '#06b6d4' },
]

const TooltipContent = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-white font-medium">{p.name}: <span className="text-pitch-400">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { matches, seasonStats } = useAppData()
  const navigate = useNavigate()
  const [activeMetric, setActiveMetric] = useState<MetricKey>('rating')

  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))

  const chartData = sorted.map(m => ({
    date: m.date.slice(5),
    goals: m.goals,
    assists: m.assists,
    passAcc: m.passAccuracy,
    rating: m.rating,
    speed: m.sprintSpeed,
    distance: m.distanceCovered,
    opponent: m.opponent,
  }))

  const radarData = matches.length > 0 ? [
    { metric: 'Scoring', value: Math.min(99, Math.round((seasonStats.goalsPerGame / 1.5) * 100)) },
    { metric: 'Passing', value: Math.round(seasonStats.avgPassAccuracy) },
    { metric: 'Fitness', value: Math.min(99, Math.round((seasonStats.avgSprintSpeed / 35) * 100)) },
    { metric: 'Speed', value: Math.min(99, Math.round((seasonStats.avgSprintSpeed / 35) * 100)) },
    { metric: 'Stamina', value: Math.min(99, Math.round((seasonStats.totalDistance / (matches.length * 12)) * 100)) },
    { metric: 'Rating', value: Math.round(seasonStats.avgRating * 10) },
  ] : []

  const selected = metrics.find(m => m.key === activeMetric)!

  if (matches.length === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Visualize your performance trends across all metrics</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 mb-6">
            <BarChart2 className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No data yet</h2>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            Your charts and analytics will appear here once you've logged at least one match.
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
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Visualize your performance trends across all metrics</p>
      </div>

      {/* Metric selector */}
      <div className="flex flex-wrap gap-2">
        {metrics.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
              activeMetric === m.key
                ? 'border-pitch-600/50 bg-pitch-600/20 text-pitch-400'
                : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Primary chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{selected.label} Over Time</CardTitle>
          <Badge variant="info">{matches.length} Matches</Badge>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selected.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={selected.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipContent />} />
              <Area
                type="monotone"
                dataKey={activeMetric}
                name={selected.label}
                stroke={selected.color}
                fill="url(#colorMetric)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: selected.color, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Secondary grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goals & Assists bar */}
        <Card>
          <CardHeader><CardTitle>Goals & Assists Per Match</CardTitle></CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<TooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar dataKey="goals" name="Goals" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="assists" name="Assists" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card>
          <CardHeader><CardTitle>Skill Radar</CardTitle></CardHeader>
          <CardContent className="pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar name="Player" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip content={<TooltipContent />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass accuracy line */}
        <Card>
          <CardHeader><CardTitle>Pass Accuracy Trend</CardTitle></CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipContent />} />
                <Line type="monotone" dataKey="passAcc" name="Pass Acc %" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }} />
                <Line type="monotone" dataKey={() => 85} stroke="#475569" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target (85%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sprint speed */}
        <Card>
          <CardHeader><CardTitle>Sprint Speed Progress</CardTitle></CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipContent />} />
                <Area type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#ec4899" fill="url(#speedGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#ec4899', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Match breakdown table */}
      <Card>
        <CardHeader><CardTitle>Match-by-Match Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Date', 'Opponent', 'Result', 'Pos', 'Min', 'G', 'A', 'PA%', 'Speed', 'Rating'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sorted.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{m.date.slice(5)}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{m.opponent}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${m.result === 'win' ? 'text-emerald-400' : m.result === 'loss' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {m.result?.toUpperCase()}
                        {m.teamScore !== undefined && ` ${m.teamScore}–${m.opponentScore}`}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-400 font-mono">{m.position}</span></td>
                    <td className="px-4 py-3 text-slate-300">{m.minutesPlayed}'</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">{m.goals}</td>
                    <td className="px-4 py-3 text-blue-400 font-semibold">{m.assists}</td>
                    <td className="px-4 py-3 text-slate-300">{m.passAccuracy}%</td>
                    <td className="px-4 py-3 text-slate-300">{m.sprintSpeed} km/h</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${m.rating >= 8 ? 'text-emerald-400' : m.rating >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {m.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
