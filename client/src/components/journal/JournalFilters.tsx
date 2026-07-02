/* ═══ Journal Filters ═════════════════════════════════════════════════════
   Instant client-side search + a premium filter bar. Everything animates
   via layout on the result list itself (see Matches.tsx), not here. */
import { Search, Star } from 'lucide-react'
import { color, font } from '@/design/tokens'
import type { Match, Position } from '@/types'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export interface JournalFilterState {
  query: string
  competition: string
  position: 'all' | Position
  result: 'all' | 'win' | 'draw' | 'loss'
  favoritesOnly: boolean
}

export const emptyFilters: JournalFilterState = {
  query: '', competition: 'all', position: 'all', result: 'all', favoritesOnly: false,
}

const selectStyle: React.CSSProperties = {
  fontFamily: font.ui, fontSize: '0.78rem', color: color.ink, background: color.surface,
  border: `1px solid ${color.border}`, borderRadius: 8, padding: '7px 10px',
}

export function JournalFilters({ matches, filters, onChange }: {
  matches: Match[]; filters: JournalFilterState; onChange: (f: JournalFilterState) => void
}) {
  const set = <K extends keyof JournalFilterState>(k: K, v: JournalFilterState[K]) => onChange({ ...filters, [k]: v })
  const competitions = [...new Set(matches.map(m => m.competition).filter(Boolean))]
  const positions = [...new Set(matches.map(m => m.position))]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: color.inkMuted }} />
        <input
          value={filters.query} onChange={e => set('query', e.target.value)}
          placeholder="Search opponent, competition, tags…"
          aria-label="Search journal entries"
          className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none transition-colors"
          style={{ fontFamily: font.ui, color: color.ink, background: color.surface, border: `1px solid ${color.border}` }}
        />
      </div>
      {competitions.length > 1 && (
        <select value={filters.competition} onChange={e => set('competition', e.target.value)} aria-label="Filter by competition" style={selectStyle}>
          <option value="all">All Competitions</option>
          {competitions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {positions.length > 1 && (
        <select value={filters.position} onChange={e => set('position', e.target.value as JournalFilterState['position'])} aria-label="Filter by position" style={selectStyle}>
          <option value="all">All Positions</option>
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
      <select value={filters.result} onChange={e => set('result', e.target.value as JournalFilterState['result'])} aria-label="Filter by result" style={selectStyle}>
        <option value="all">All Results</option>
        <option value="win">Wins</option>
        <option value="draw">Draws</option>
        <option value="loss">Losses</option>
      </select>
      <button onClick={() => set('favoritesOnly', !filters.favoritesOnly)}
        aria-pressed={filters.favoritesOnly}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
        style={{
          ...BC,
          background: filters.favoritesOnly ? 'rgba(255,186,8,0.12)' : color.surface,
          color: filters.favoritesOnly ? '#ffba08' : color.inkMuted,
          border: `1px solid ${filters.favoritesOnly ? 'rgba(255,186,8,0.4)' : color.border}`,
        }}>
        <Star className="h-3.5 w-3.5" style={filters.favoritesOnly ? { fill: '#ffba08' } : undefined} /> Favorites
      </button>
    </div>
  )
}

export function filterMatches(matches: Match[], f: JournalFilterState): Match[] {
  const q = f.query.trim().toLowerCase()
  return matches.filter(m =>
    (!q || m.opponent.toLowerCase().includes(q) || m.competition.toLowerCase().includes(q) || (m.tags ?? []).some(t => t.toLowerCase().includes(q))) &&
    (f.competition === 'all' || m.competition === f.competition) &&
    (f.position === 'all' || m.position === f.position) &&
    (f.result === 'all' || m.result === f.result) &&
    (!f.favoritesOnly || m.favorite)
  )
}
