import { useState } from 'react'
import { Plus, Search, Filter, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppData } from '@/hooks/useAppData'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { formatDate, getResultBadge, getRatingColor, getPositionColor } from '@/lib/utils'
import type { Match, Position } from '@/types'

const emptyForm: Omit<Match, 'id' | 'userId' | 'createdAt'> = {
  date: new Date().toISOString().slice(0, 10),
  opponent: '',
  competition: '',
  venue: 'home',
  result: 'win',
  teamScore: 0,
  opponentScore: 0,
  position: 'CM',
  minutesPlayed: 90,
  goals: 0,
  assists: 0,
  shots: 0,
  shotsOnTarget: 0,
  passAccuracy: 80,
  tackles: 0,
  interceptions: 0,
  distanceCovered: 10,
  sprintSpeed: 30,
  rating: 7,
  notes: '',
}

const positions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST']

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-400 mb-1">{children}</label>
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-pitch-600 focus:outline-none focus:ring-1 focus:ring-pitch-600/50 ${className}`}
    />
  )
}

function Select({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:border-pitch-600 focus:outline-none focus:ring-1 focus:ring-pitch-600/50 ${className}`}
    />
  )
}

export default function Matches() {
  const { matches: initialMatches, isDemo } = useAppData()
  const { user } = useAuth()
  const { apiFetch } = useApi()
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const filtered = matches.filter(m =>
    m.opponent.toLowerCase().includes(search.toLowerCase()) ||
    m.competition.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (!isDemo && user) {
        // Save to DB (optimistically update UI first)
        const optimistic: Match = {
          ...form, id: crypto.randomUUID(),
          userId: user.uid, createdAt: new Date().toISOString(),
        }
        const updated = [optimistic, ...matches]
        setMatches(updated)
        localStorage.setItem(`matches_${user.uid}`, JSON.stringify(updated))
        setForm(emptyForm)
        setShowForm(false)
        // Persist to DB in background
        apiFetch('/api/matches', { method: 'POST', body: JSON.stringify(form) }).catch(() => {})
      } else {
        const newMatch: Match = {
          ...form, id: crypto.randomUUID(),
          userId: 'demo-user', createdAt: new Date().toISOString(),
        }
        setMatches(prev => [newMatch, ...prev])
        setForm(emptyForm)
        setShowForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Matches</h1>
          <p className="mt-1 text-sm text-slate-500">{matches.length} matches logged this season</p>
        </div>
        <Button data-tour="log-match-btn" variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Log Match
        </Button>
      </div>

      {/* Log Match Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-base font-semibold text-white">Log New Match</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Date *</Label>
                  <Input type="date" required value={form.date} onChange={e => field('date', e.target.value)} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Opponent *</Label>
                  <Input placeholder="e.g. Riverview FC" required value={form.opponent} onChange={e => field('opponent', e.target.value)} />
                </div>
                <div>
                  <Label>Competition</Label>
                  <Input placeholder="e.g. ECNL Regional" value={form.competition} onChange={e => field('competition', e.target.value)} />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Select value={form.venue} onChange={e => field('venue', e.target.value as 'home' | 'away' | 'neutral')}>
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                    <option value="neutral">Neutral</option>
                  </Select>
                </div>
                <div>
                  <Label>Result</Label>
                  <Select value={form.result} onChange={e => field('result', e.target.value as 'win' | 'loss' | 'draw')}>
                    <option value="win">Win</option>
                    <option value="draw">Draw</option>
                    <option value="loss">Loss</option>
                  </Select>
                </div>
                <div>
                  <Label>Score (Your Team – Opp)</Label>
                  <div className="flex gap-2">
                    <Input type="number" min="0" placeholder="0" value={form.teamScore} onChange={e => field('teamScore', Number(e.target.value))} />
                    <span className="self-center text-slate-500">–</span>
                    <Input type="number" min="0" placeholder="0" value={form.opponentScore} onChange={e => field('opponentScore', Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <Label>Position</Label>
                  <Select value={form.position} onChange={e => field('position', e.target.value as Position)}>
                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Minutes Played</Label>
                  <Input type="number" min="0" max="120" value={form.minutesPlayed} onChange={e => field('minutesPlayed', Number(e.target.value))} />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Performance Stats</p>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Goals</Label><Input type="number" min="0" value={form.goals} onChange={e => field('goals', Number(e.target.value))} /></div>
                  <div><Label>Assists</Label><Input type="number" min="0" value={form.assists} onChange={e => field('assists', Number(e.target.value))} /></div>
                  <div><Label>Shots</Label><Input type="number" min="0" value={form.shots} onChange={e => field('shots', Number(e.target.value))} /></div>
                  <div><Label>Pass Accuracy %</Label><Input type="number" min="0" max="100" value={form.passAccuracy} onChange={e => field('passAccuracy', Number(e.target.value))} /></div>
                  <div><Label>Tackles</Label><Input type="number" min="0" value={form.tackles} onChange={e => field('tackles', Number(e.target.value))} /></div>
                  <div><Label>Distance (km)</Label><Input type="number" min="0" step="0.1" value={form.distanceCovered} onChange={e => field('distanceCovered', Number(e.target.value))} /></div>
                  <div><Label>Sprint Speed (km/h)</Label><Input type="number" min="0" step="0.1" value={form.sprintSpeed} onChange={e => field('sprintSpeed', Number(e.target.value))} /></div>
                  <div><Label>Rating (1–10)</Label><Input type="number" min="1" max="10" step="0.5" value={form.rating} onChange={e => field('rating', Number(e.target.value))} /></div>
                </div>
              </div>

              <div>
                <Label>Match Notes</Label>
                <textarea
                  rows={3}
                  placeholder="Anything worth remembering from this match..."
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-pitch-600 focus:outline-none focus:ring-1 focus:ring-pitch-600/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Match</Button>
              </div>
            </form>
          </div>
        </div>
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
        <Button variant="outline" size="md">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* Match cards */}
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
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(match.date)} · {match.competition}</p>
                    {match.notes && <p className="mt-1.5 text-xs text-slate-500 italic truncate max-w-md">"{match.notes}"</p>}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-4 sm:gap-6 text-center flex-shrink-0">
                    <div>
                      <p className="text-lg font-bold text-emerald-400">{match.goals}</p>
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

      {filtered.length === 0 && (
        <div className="py-20 text-center text-slate-500">
          <p className="text-lg font-medium">No matches found</p>
          <p className="text-sm mt-1">Try a different search or log your first match.</p>
        </div>
      )}
    </div>
  )
}
