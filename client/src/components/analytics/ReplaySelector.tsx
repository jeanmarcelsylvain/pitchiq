/* ═══ Replay Selector ═════════════════════════════════════════════════════
   Premium match picker for Match Replay Studio — search, season/competition
   filters, and date sorting over the athlete's full career history. */
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpDown, Clock } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { getResultBadge } from '@/lib/utils'
import type { CareerMatch } from '@/hooks/useCareerMatches'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

const selectStyle: React.CSSProperties = {
  ...B, fontSize: '0.78rem', color: color.ink, background: color.surface,
  border: `1px solid ${color.border}`, borderRadius: 8, padding: '6px 10px',
}

export function ReplaySelector({ matches, selectedId, onSelect, recentIds }: {
  matches: CareerMatch[]; selectedId: string | null; onSelect: (id: string) => void; recentIds: string[]
}) {
  const [query, setQuery] = useState('')
  const [season, setSeason] = useState('all')
  const [competition, setCompetition] = useState('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')

  const seasons = useMemo(() => {
    const seen = new Map<string, string>()
    matches.forEach(m => seen.set(m.seasonId, m.seasonName))
    return [...seen.entries()]
  }, [matches])

  const competitions = useMemo(() => [...new Set(matches.map(m => m.competition).filter(Boolean))], [matches])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = matches.filter(m =>
      (season === 'all' || m.seasonId === season) &&
      (competition === 'all' || m.competition === competition) &&
      (!q || m.opponent.toLowerCase().includes(q) || m.competition.toLowerCase().includes(q))
    )
    list = [...list].sort((a, b) => sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
    return list
  }, [matches, query, season, competition, sort])

  const recent = useMemo(
    () => recentIds.map(id => matches.find(m => m.id === id)).filter((m): m is CareerMatch => !!m),
    [recentIds, matches]
  )

  return (
    <div>
      {/* recently viewed */}
      {recent.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3 w-3" style={{ color: color.inkMuted }} aria-hidden />
            <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.14em', color: color.inkMuted, fontWeight: 700 }}>RECENTLY VIEWED</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recent.map(m => (
              <MatchChip key={m.id} match={m} active={m.id === selectedId} onClick={() => onSelect(m.id)} compact />
            ))}
          </div>
        </div>
      )}

      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: color.inkMuted }} aria-hidden />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search opponent or competition…"
            aria-label="Search matches"
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none transition-colors"
            style={{ ...B, fontSize: '0.8rem', color: color.ink, background: color.surface, border: `1px solid ${color.border}` }}
          />
        </div>
        {seasons.length > 1 && (
          <select value={season} onChange={e => setSeason(e.target.value)} aria-label="Filter by season" style={selectStyle}>
            <option value="all">All Seasons</option>
            {seasons.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
        {competitions.length > 1 && (
          <select value={competition} onChange={e => setCompetition(e.target.value)} aria-label="Filter by competition" style={selectStyle}>
            <option value="all">All Competitions</option>
            {competitions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button onClick={() => setSort(s => s === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{ ...B, color: color.inkMuted, border: `1px solid ${color.border}`, background: color.surface }}>
          <ArrowUpDown className="h-3 w-3" aria-hidden /> {sort === 'newest' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* results grid */}
      {filtered.length === 0 ? (
        <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }} className="py-6 text-center">No matches found for these filters.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filtered.map(m => (
              <MatchChip key={m.id} match={m} active={m.id === selectedId} onClick={() => onSelect(m.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function MatchChip({ match, active, onClick, compact }: { match: CareerMatch; active: boolean; onClick: () => void; compact?: boolean }) {
  const result = getResultBadge(match.result)
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease }}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`vs ${match.opponent}, ${match.seasonName}, ${match.rating.toFixed(1)} rating`}
      className="text-left rounded-lg p-2.5 transition-colors shrink-0"
      style={{
        width: compact ? 148 : undefined,
        border: `1px solid ${active ? color.accent : color.border}`,
        background: active ? 'rgba(255,90,60,0.08)' : color.surface,
      }}>
      <div className="flex items-center justify-between mb-1">
        <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${result.className}`}>
          {result.label}
        </span>
        <span style={{ ...MONO, fontSize: '0.65rem', color: active ? color.accent : color.inkMuted }}>{match.rating.toFixed(1)}</span>
      </div>
      <p style={{ ...B, fontSize: '0.75rem', fontWeight: 600, color: color.ink }} className="truncate">vs {match.opponent}</p>
      <p style={{ ...B, fontSize: '0.62rem', color: color.inkMuted }} className="truncate">{match.seasonName} · {match.date.slice(5)}</p>
    </motion.button>
  )
}
