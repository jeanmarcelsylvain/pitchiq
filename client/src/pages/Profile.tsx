import { User, MapPin, Zap, Shield, Star, TrendingUp, Activity, Clock } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAppData } from '@/hooks/useAppData'
import { getPositionColor, formatDistance, formatSpeed } from '@/lib/utils'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

export default function Profile() {
  const { profile, seasonStats, matches } = useAppData()

  const wins = matches.filter(m => m.result === 'win').length
  const losses = matches.filter(m => m.result === 'loss').length
  const draws = matches.filter(m => m.result === 'draw').length
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0

  const radarData = matches.length > 0 ? [
    { metric: 'Scoring', value: Math.min(99, Math.round((seasonStats.goalsPerGame / 1.5) * 100)) },
    { metric: 'Passing', value: Math.round(seasonStats.avgPassAccuracy) },
    { metric: 'Fitness', value: Math.min(99, Math.round((seasonStats.avgSprintSpeed / 35) * 100)) },
    { metric: 'Speed', value: Math.min(99, Math.round((seasonStats.avgSprintSpeed / 35) * 100)) },
    { metric: 'Stamina', value: Math.min(99, Math.round((seasonStats.totalDistance / (matches.length * 12)) * 100)) },
    { metric: 'Rating', value: Math.round(seasonStats.avgRating * 10) },
  ] : [
    { metric: 'Scoring', value: 0 },
    { metric: 'Passing', value: 0 },
    { metric: 'Fitness', value: 0 },
    { metric: 'Speed', value: 0 },
    { metric: 'Stamina', value: 0 },
    { metric: 'Rating', value: 0 },
  ]

  const initials = profile.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Player Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your career stats and identity on the pitch</p>
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="relative h-24 bg-gradient-to-r from-pitch-900/60 via-slate-800/40 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-pitch-600/20 via-transparent to-transparent" />
        </div>
        <CardContent className="relative -mt-10 px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="h-20 w-20 rounded-2xl border-4 border-slate-900 bg-gradient-to-br from-pitch-600 to-pitch-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">{initials}</span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{profile.name || 'Your Name'}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                {profile.club && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.club}</span>}
                {profile.age > 0 && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{profile.age} years old</span>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={getPositionColor(profile.primaryPosition)} size="md" variant="outline">
                {profile.primaryPosition} (Primary)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical & meta */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Dominant Foot', value: profile.dominantFoot.charAt(0).toUpperCase() + profile.dominantFoot.slice(1), icon: Zap },
          { label: 'Position', value: profile.primaryPosition, icon: Shield },
          { label: 'Club', value: profile.club || '—', icon: MapPin },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Icon className="h-3.5 w-3.5" />
              <p className="text-xs uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-lg font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Season stats */}
        <Card>
          <CardHeader><CardTitle>Season Statistics</CardTitle></CardHeader>
          <CardContent className="space-y-0 p-0">
            <div className="divide-y divide-slate-800/50">
              {[
                { label: 'Matches', value: seasonStats.matches, icon: Activity },
                { label: 'Goals', value: seasonStats.goals, sub: `${seasonStats.goalsPerGame.toFixed(2)}/game`, icon: Star },
                { label: 'Assists', value: seasonStats.assists, sub: `${seasonStats.assistsPerGame.toFixed(2)}/game`, icon: TrendingUp },
                { label: 'Minutes Played', value: seasonStats.minutesPlayed.toLocaleString(), icon: Clock },
                { label: 'Avg Pass Accuracy', value: `${seasonStats.avgPassAccuracy.toFixed(1)}%`, icon: Zap },
                { label: 'Avg Rating', value: `${seasonStats.avgRating.toFixed(1)} / 10`, icon: Star },
                { label: 'Avg Sprint Speed', value: formatSpeed(seasonStats.avgSprintSpeed), icon: Zap },
                { label: 'Total Distance', value: formatDistance(seasonStats.totalDistance), icon: MapPin },
              ].map(({ label, value, sub, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 px-6 py-3">
                  <Icon className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  <p className="flex-1 text-sm text-slate-400">{label}</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{value}</p>
                    {sub && <p className="text-xs text-slate-600">{sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* W/D/L record */}
          <Card>
            <CardHeader><CardTitle>Match Record</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-pitch-500/10 border border-pitch-500/20 p-4">
                  <p className="text-3xl font-black text-pitch-400">{wins}</p>
                  <p className="text-xs text-slate-500 mt-1">Wins</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                  <p className="text-3xl font-black text-yellow-400">{draws}</p>
                  <p className="text-xs text-slate-500 mt-1">Draws</p>
                </div>
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-3xl font-black text-red-400">{losses}</p>
                  <p className="text-xs text-slate-500 mt-1">Losses</p>
                </div>
              </div>
              {matches.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Win Rate</span>
                    <span>{winRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pitch-600 to-pitch-500"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                </div>
              )}
              {matches.length === 0 && (
                <p className="text-xs text-slate-500 text-center mt-4">Log matches to see your record</p>
              )}
            </CardContent>
          </Card>

          {/* Skill radar */}
          <Card>
            <CardHeader><CardTitle>Attribute Ratings</CardTitle></CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Calculated from your match data after you log games</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1d1530" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#5c4888', fontSize: 11 }} />
                      <Radar name="Player" dataKey="value" stroke="#ff5a3c" fill="#ff5a3c" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {radarData.map(r => (
                      <div key={r.metric} className="text-center">
                        <p className="text-base font-bold text-white">{r.value}</p>
                        <p className="text-xs text-slate-600">{r.metric}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
