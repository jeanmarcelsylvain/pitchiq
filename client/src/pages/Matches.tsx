import { useState } from 'react'
import { Plus, Search, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MatchEntryFlow } from '@/components/journal/MatchEntryFlow'
import { useAppData } from '@/hooks/useAppData'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { formatDate, getResultBadge, getRatingColor, getPositionColor } from '@/lib/utils'
import { color, font } from '@/design/tokens'
import type { Match, MatchReflection } from '@/types'

const sectionLabel = { fontFamily: font.display, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const

export default function Matches() {
  const { matches: initialMatches, isDemo } = useAppData()
  const { user } = useAuth()
  const { apiFetch } = useApi()
  const uid = isDemo ? 'demo' : user?.uid ?? ''
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [flowMode, setFlowMode] = useState<'quick' | 'full' | null>(null)
  const [search, setSearch] = useState('')

  const filtered = matches.filter(m =>
    m.opponent.toLowerCase().includes(search.toLowerCase()) ||
    m.competition.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (form: Omit<Match, 'id' | 'userId' | 'createdAt'>, reflection: MatchReflection) => {
    const payload = { ...form, reflection: Object.keys(reflection).length ? reflection : undefined }
    if (!isDemo && user) {
      const optimistic: Match = { ...payload, id: crypto.randomUUID(), userId: user.uid, createdAt: new Date().toISOString() }
      const updated = [optimistic, ...matches]
      setMatches(updated)
      localStorage.setItem(`matches_${user.uid}`, JSON.stringify(updated))
      apiFetch('/api/matches', { method: 'POST', body: JSON.stringify(payload) }).catch(err => console.error('DB save failed:', err))
    } else {
      const newMatch: Match = { ...payload, id: crypto.randomUUID(), userId: 'demo-user', createdAt: new Date().toISOString() }
      setMatches(prev => [newMatch, ...prev])
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p style={sectionLabel} className="uppercase">Match Journal</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Your career, one entry at a time.</h1>
          <p className="mt-1 text-sm text-slate-500">{matches.length} journal entries this season</p>
        </div>
        <Button data-tour="log-match-btn" variant="primary" onClick={() => setFlowMode('full')}>
          <Plus className="h-4 w-4" /> New Match Entry
        </Button>
      </div>

      {flowMode && (
        <MatchEntryFlow
          uid={uid}
          recentMatches={[...matches].sort((a, b) => b.date.localeCompare(a.date))}
          initialMode={flowMode}
          onClose={() => setFlowMode(null)}
          onSave={handleSave}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by opponent or competition..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-pitch-600 focus:outline-none focus:ring-1 focus:ring-pitch-600/50"
          />
        </div>
        <Button variant="outline" size="md" onClick={() => setFlowMode('quick')}>
          <Zap className="h-4 w-4" /> Quick Log
        </Button>
      </div>

      {/* Journal entries */}
      <div className="space-y-3">
        {filtered.map(match => {
          const result = getResultBadge(match.result)
          return (
            <Card key={match.id} hover className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                  {/* Result badge */}
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2 text-lg font-black ${result.className}`}>
                    {result.label}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">vs {match.opponent}</h3>
                      {match.teamScore !== undefined && (
                        <span className="text-sm text-slate-400">{match.teamScore}–{match.opponentScore}</span>
                      )}
                      <Badge className={getPositionColor(match.position)} variant="outline">{match.position}</Badge>
                      <Badge variant="outline">{match.venue}</Badge>
                      {match.reflection && (
                        <Badge variant="info">Reflected</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(match.date)} · {match.competition}</p>
                    {match.notes && <p className="mt-1.5 text-xs text-slate-500 italic truncate max-w-md">"{match.notes}"</p>}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-4 sm:gap-6 text-center flex-shrink-0">
                    <div>
                      <p className="text-lg font-bold text-pitch-400">{match.goals}</p>
                      <p className="text-xs text-slate-600">Goals</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-400">{match.assists}</p>
                      <p className="text-xs text-slate-600">Assists</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-400">{match.passAccuracy}%</p>
                      <p className="text-xs text-slate-600">Pass Acc</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${getRatingColor(match.rating)}`}>{match.rating.toFixed(1)}</p>
                      <p className="text-xs text-slate-600">Rating</p>
                    </div>
                  </div>

                  {/* Secondary stats */}
                  <div className="hidden lg:grid grid-cols-3 gap-4 text-center flex-shrink-0 border-l border-slate-800 pl-6">
                    <div>
                      <p className="text-sm font-semibold text-slate-300">{match.minutesPlayed}'</p>
                      <p className="text-xs text-slate-600">Min</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">{match.sprintSpeed}</p>
                      <p className="text-xs text-slate-600">km/h</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">{match.distanceCovered}</p>
                      <p className="text-xs text-slate-600">km</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && matches.length > 0 && (
        <div className="py-20 text-center text-slate-500">
          <p className="text-lg font-medium">No entries found</p>
          <p className="text-sm mt-1">Try a different search.</p>
        </div>
      )}

      {matches.length === 0 && (
        <div className="py-20 text-center text-slate-500">
          <p className="text-lg font-medium">Your journal is empty</p>
          <p className="text-sm mt-1">Log your first match — it takes less than a minute.</p>
        </div>
      )}
    </div>
  )
}
