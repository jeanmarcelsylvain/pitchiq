import { useState } from 'react'
import { Archive, Plus, ChevronDown, ChevronUp, Trophy, Target, Star, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/hooks/useAppData'
import { useApi } from '@/hooks/useApi'
import type { Match } from '@/types'

interface ArchivedSeason {
  id: string
  name: string
  startDate: string
  endDate: string
  archivedAt: string
  matches: Match[]
  goals: number
  assists: number
  wins: number
  losses: number
  draws: number
  avgRating: number
  highlights: string
}

function ARCHIVE_KEY(uid: string) { return `season_archive_${uid}` }
function MATCHES_KEY(uid: string) { return `matches_${uid}` }

export default function SeasonArchive() {
  const { user, isDemoMode } = useAuth()
  const { matches, seasonStats } = useAppData()
  const { apiFetch } = useApi()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  const [archive, setArchive] = useState<ArchivedSeason[]>(() => {
    try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY(uid)) ?? '[]') } catch { return [] }
  })
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showArchiveForm, setShowArchiveForm] = useState(false)
  const [seasonName, setSeasonName] = useState(`Season ${new Date().getFullYear()}`)
  const [highlights, setHighlights] = useState('')
  const [confirming, setConfirming] = useState(false)

  const totalGoals = matches.reduce((s, m) => s + m.goals, 0)
  const totalAssists = matches.reduce((s, m) => s + m.assists, 0)
  const wins = matches.filter(m => m.result === 'win').length
  const losses = matches.filter(m => m.result === 'loss').length
  const draws = matches.filter(m => m.result === 'draw').length

  const archiveCurrentSeason = () => {
    if (!matches.length) return
    const season: ArchivedSeason = {
      id: Date.now().toString(),
      name: seasonName,
      startDate: matches[matches.length - 1]?.date ?? '',
      endDate: matches[0]?.date ?? '',
      archivedAt: new Date().toISOString(),
      matches: [...matches],
      goals: totalGoals,
      assists: totalAssists,
      wins, losses, draws,
      avgRating: seasonStats.avgRating,
      highlights,
    }
    const updated = [season, ...archive]
    setArchive(updated)
    localStorage.setItem(ARCHIVE_KEY(uid), JSON.stringify(updated))
    localStorage.setItem(MATCHES_KEY(uid), JSON.stringify([]))

    if (!isDemoMode) {
      apiFetch('/api/seasons', { method: 'POST', body: JSON.stringify({
        name: season.name, startDate: season.startDate, endDate: season.endDate,
        matches: season.matches, goals: season.goals, assists: season.assists,
        wins: season.wins, losses: season.losses, draws: season.draws,
        avgRating: season.avgRating, highlights: season.highlights,
      })}).catch(() => {})
    }
    setShowArchiveForm(false)
    setConfirming(false)
    window.location.reload()
  }

  const deleteSeason = (id: string) => {
    const updated = archive.filter(s => s.id !== id)
    setArchive(updated)
    localStorage.setItem(ARCHIVE_KEY(uid), JSON.stringify(updated))
  }

  const winRate = (s: ArchivedSeason) => s.matches.length > 0 ? Math.round((s.wins / s.matches.length) * 100) : 0

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Season Archive</h1>
          <p className="mt-1 text-sm text-slate-500">Archive completed seasons and track your progression over time</p>
        </div>
        {matches.length > 0 && (
          <button onClick={() => setShowArchiveForm(true)}
            className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-all">
            <Archive className="h-4 w-4" /> Archive Current Season
          </button>
        )}
      </div>

      {/* Current Season Summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-sm font-semibold text-white">Current Season</p>
        </div>
        {matches.length === 0 ? (
          <p className="text-sm text-slate-600">No matches logged this season yet. Head to Matches to start tracking.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Matches', value: matches.length },
              { label: 'Goals', value: totalGoals },
              { label: 'Assists', value: totalAssists },
              { label: 'Wins', value: wins },
              { label: 'Losses', value: losses },
              { label: 'Draws', value: draws },
              { label: 'Avg Rating', value: `${seasonStats.avgRating.toFixed(1)}/10` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <p className="text-xl font-extrabold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Seasons */}
      {archive.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 mb-4">
            <Archive className="h-7 w-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No archived seasons yet</p>
          <p className="text-slate-600 text-sm mt-1">Complete a season and archive it to track your year-over-year growth</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Past Seasons</h2>
          {archive.map(season => (
            <div key={season.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => setExpanded(expanded === season.id ? null : season.id)}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{season.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(season.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                      {new Date(season.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <span className="text-white font-bold">{season.matches.length}<span className="text-slate-500 font-normal text-xs ml-1">games</span></span>
                    <span className="text-green-400 font-bold">{season.goals}G</span>
                    <span className="text-blue-400 font-bold">{season.assists}A</span>
                    <span className="text-slate-400 text-xs">{winRate(season)}% wins</span>
                  </div>
                  {expanded === season.id ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </div>
              </div>

              {expanded === season.id && (
                <div className="border-t border-slate-800 p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { label: 'Matches', value: season.matches.length },
                      { label: 'Goals', value: season.goals },
                      { label: 'Assists', value: season.assists },
                      { label: 'Wins', value: season.wins },
                      { label: 'Losses', value: season.losses },
                      { label: 'Draws', value: season.draws },
                      { label: 'Avg Rating', value: `${season.avgRating.toFixed(1)}/10` },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center rounded-xl border border-slate-800 bg-slate-800/30 p-3">
                        <p className="text-lg font-extrabold text-white">{value}</p>
                        <p className="text-xs text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  {season.highlights && (
                    <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-3.5 w-3.5 text-yellow-400" />
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Season Highlights</p>
                      </div>
                      <p className="text-sm text-slate-300">{season.highlights}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                      Archived {new Date(season.archivedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <button onClick={() => deleteSeason(season.id)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Archive form modal */}
      {showArchiveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Archive Current Season</h2>
              <button onClick={() => { setShowArchiveForm(false); setConfirming(false) }} className="text-slate-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
              <p className="text-sm text-yellow-300 font-medium">⚠️ This will clear your current season's match data</p>
              <p className="text-xs text-yellow-400/70 mt-1">All {matches.length} matches will be saved to the archive and your active season will reset to 0 matches.</p>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Season Name</label>
              <input value={seasonName} onChange={e => setSeasonName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-green-500 transition-colors" />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Season Highlights (optional)</label>
              <textarea value={highlights} onChange={e => setHighlights(e.target.value)}
                placeholder="Best moment, personal achievements, what you learned..."
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-green-500 transition-colors resize-none" />
            </div>

            {!confirming ? (
              <div className="flex gap-2">
                <button onClick={() => setShowArchiveForm(false)}
                  className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-400 hover:text-white transition-all">Cancel</button>
                <button onClick={() => setConfirming(true)}
                  className="flex-1 rounded-xl bg-yellow-600 hover:bg-yellow-500 py-2.5 text-sm font-semibold text-white transition-all">
                  Archive Season
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-slate-400">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirming(false)}
                    className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-400 hover:text-white transition-all">Go Back</button>
                  <button onClick={archiveCurrentSeason}
                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-sm font-semibold text-white transition-all">
                    Yes, Archive
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
