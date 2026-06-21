import { useParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

export default function ScoutView() {
  const { encoded } = useParams<{ encoded: string }>()

  let data: {
    name: string
    position: string
    club: string
    age: number
    foot: string
    stats: {
      matches: number
      goals: number
      assists: number
      avgRating: number
      avgPassAccuracy: number
      avgSprintSpeed: number
      winRate: number
    }
  } | null = null

  try {
    data = JSON.parse(atob(encoded ?? ''))
  } catch {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500">Invalid or expired profile link.</p>
      </div>
    )
  }

  const { stats } = data

  const radarData = [
    { skill: 'Finishing', value: Math.min(100, stats.goals * 8 + 30) },
    { skill: 'Passing', value: stats.avgPassAccuracy || 70 },
    { skill: 'Pace', value: Math.min(100, (stats.avgSprintSpeed / 35) * 100) },
    { skill: 'Consistency', value: Math.min(100, stats.avgRating * 10) },
    { skill: 'Creativity', value: Math.min(100, stats.assists * 10 + 30) },
    { skill: 'Work Rate', value: Math.min(100, stats.matches * 4 + 40) },
  ]

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pitch-600">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white">MyFutbolPro</span>
        </div>
        <p className="text-xs text-slate-500">Recruitment Profile</p>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
          <div className="bg-gradient-to-r from-pitch-900/60 to-slate-900 border-b border-slate-800 px-8 py-8">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-pitch-600/20 text-2xl font-bold text-pitch-400 border border-pitch-600/30">
                {data.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">{data.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="rounded-lg bg-pitch-600/20 border border-pitch-600/30 px-3 py-1 text-sm font-semibold text-pitch-400">
                    {data.position}
                  </span>
                  {data.club && <span className="text-sm text-slate-400">{data.club}</span>}
                  {data.age && <span className="text-sm text-slate-400">Age {data.age}</span>}
                  {data.foot && <span className="text-sm text-slate-400">{data.foot} foot</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-8 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Season Statistics</p>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {[
                { label: 'Matches', value: stats.matches },
                { label: 'Goals', value: stats.goals },
                { label: 'Assists', value: stats.assists },
                { label: 'Avg Rating', value: `${stats.avgRating.toFixed(1)}/10` },
                { label: 'Pass Acc.', value: `${stats.avgPassAccuracy}%` },
                { label: 'Win Rate', value: `${stats.winRate}%` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <p className="text-xl font-extrabold text-white">{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Radar */}
          <div className="px-8 pb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Skill Profile</p>
            <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-slate-800 px-8 py-4">
            <p className="text-xs text-slate-600">Shared via MyFutbolPro · myfutbolpro.vercel.app</p>
          </div>
        </div>
      </div>
    </div>
  )
}
