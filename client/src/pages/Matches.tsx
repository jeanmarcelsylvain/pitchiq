/* ═══ Match Journal ═══════════════════════════════════════════════════════
   A career archive, not a spreadsheet. Premium timeline cards, instant
   search/filters, favorites, tags, AI highlights, mood history, match
   comparison, cinematic details, inline editing, and non-destructive
   delete — all built on the Phase 2C-1 entry flow. */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Zap, GitCompare, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CareerMessage } from '@/components/ui/CareerMessage'
import { MatchEntryFlow } from '@/components/journal/MatchEntryFlow'
import { MatchCard } from '@/components/journal/MatchCard'
import { MatchDetails } from '@/components/journal/MatchDetails'
import { MatchCompare } from '@/components/journal/MatchCompare'
import { EditMatchModal } from '@/components/journal/EditMatchModal'
import { JournalFilters, filterMatches, emptyFilters, type JournalFilterState } from '@/components/journal/JournalFilters'
import { AIHighlights, MoodHistory } from '@/components/journal/JournalWidgets'
import { detectMilestone } from '@/lib/matchIntel'
import { getCareerMessage } from '@/lib/careerMessages'
import { useAppData } from '@/hooks/useAppData'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { color, font } from '@/design/tokens'
import type { Match, MatchReflection } from '@/types'

const sectionLabel = { fontFamily: font.display, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const
const PAGE_SIZE = 12

function seenMilestonesKey(uid: string) { return `journal_milestones_seen_${uid}` }

export default function Matches() {
  const { matches: initialMatches, isDemo } = useAppData()
  const { user } = useAuth()
  const { apiFetch } = useApi()
  const uid = isDemo ? 'demo' : user?.uid ?? ''

  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [flowMode, setFlowMode] = useState<'quick' | 'full' | null>(null)
  const [filters, setFilters] = useState<JournalFilterState>(emptyFilters)
  const [detailsMatch, setDetailsMatch] = useState<Match | null>(null)
  const [editMatch, setEditMatch] = useState<Match | null>(null)
  const [deletePending, setDeletePending] = useState<{ match: Match; timer: number } | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareSelection, setCompareSelection] = useState<string[]>([])
  const [comparePair, setComparePair] = useState<[Match, Match] | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [milestone, setMilestone] = useState<string | null>(null)

  const filtered = useMemo(() => filterMatches(matches, filters), [matches, filters])
  const visible = filtered.slice(0, visibleCount)

  const persist = (updated: Match[]) => {
    setMatches(updated)
    if (!isDemo && user) localStorage.setItem(`matches_${user.uid}`, JSON.stringify(updated))
  }

  const checkMilestone = (updated: Match[]) => {
    const m = detectMilestone(updated)
    if (!m) return
    const key = seenMilestonesKey(uid)
    const seen: string[] = JSON.parse(localStorage.getItem(key) ?? '[]')
    const id = `${m.trigger}:${m.note}:${updated.length}`
    if (seen.includes(id)) return
    localStorage.setItem(key, JSON.stringify([...seen, id].slice(-30)))
    setMilestone(getCareerMessage(m.trigger) || m.note)
  }

  const handleSave = (form: Omit<Match, 'id' | 'userId' | 'createdAt'>, reflection: MatchReflection) => {
    const payload = { ...form, reflection: Object.keys(reflection).length ? reflection : undefined }
    const newMatch: Match = { ...payload, id: crypto.randomUUID(), userId: isDemo ? 'demo-user' : user!.uid, createdAt: new Date().toISOString() }
    const updated = [newMatch, ...matches]
    persist(updated)
    if (!isDemo && user) apiFetch('/api/matches', { method: 'POST', body: JSON.stringify(payload) }).catch(err => console.error('DB save failed:', err))
    checkMilestone(updated)
  }

  const updateMatch = (id: string, patch: Partial<Match>) => {
    const updated = matches.map(m => m.id === id ? { ...m, ...patch } : m)
    persist(updated)
    if (!isDemo && user) apiFetch(`/api/matches/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).catch(() => {})
  }

  const requestDelete = (match: Match) => {
    setDetailsMatch(null)
    persist(matches.filter(m => m.id !== match.id))
    const timer = window.setTimeout(() => {
      if (!isDemo && user) apiFetch(`/api/matches/${match.id}`, { method: 'DELETE' }).catch(() => {})
      setDeletePending(null)
    }, 6000)
    setDeletePending({ match, timer })
  }
  const undoDelete = () => {
    if (!deletePending) return
    clearTimeout(deletePending.timer)
    persist([deletePending.match, ...matches])
    setDeletePending(null)
  }

  const toggleFavorite = (m: Match) => updateMatch(m.id, { favorite: !m.favorite })

  const toggleCompareSelect = (id: string) => {
    setCompareSelection(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(-2)
      if (next.length === 2) {
        const [a, b] = next.map(mid => matches.find(m => m.id === mid)!)
        setComparePair([a, b])
        setCompareMode(false)
        return []
      }
      return next
    })
  }

  const recentMatches = useMemo(() => [...matches].sort((a, b) => b.date.localeCompare(a.date)), [matches])
  const priorTo = (m: Match) => matches.filter(x => x.id !== m.id && x.date <= m.date)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p style={sectionLabel} className="uppercase">Match Journal</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Your career, one entry at a time.</h1>
          <p className="mt-1 text-sm text-slate-500">{matches.length} journal entries this season</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={compareMode ? 'ai' : 'outline'} size="md" onClick={() => { setCompareMode(v => !v); setCompareSelection([]) }}>
            <GitCompare className="h-4 w-4" /> {compareMode ? `Select 2 (${compareSelection.length}/2)` : 'Compare'}
          </Button>
          <Button variant="outline" size="md" onClick={() => setFlowMode('quick')}>
            <Zap className="h-4 w-4" /> Quick Log
          </Button>
          <Button data-tour="log-match-btn" variant="primary" onClick={() => setFlowMode('full')}>
            <Plus className="h-4 w-4" /> New Match Entry
          </Button>
        </div>
      </div>

      {milestone && (
        <CareerMessage message={milestone} onDismiss={() => setMilestone(null)} />
      )}

      {flowMode && (
        <MatchEntryFlow uid={uid} recentMatches={recentMatches} initialMode={flowMode} onClose={() => setFlowMode(null)} onSave={handleSave} />
      )}

      {matches.length >= 2 && (
        <div className="space-y-5">
          <AIHighlights matches={matches} onOpen={setDetailsMatch} />
          {matches.filter(m => m.reflection).length >= 2 && (
            <div className="rounded-xl p-5" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
              <p style={{ ...sectionLabel }} className="uppercase mb-3">Mood History</p>
              <MoodHistory matches={matches} />
            </div>
          )}
        </div>
      )}

      <JournalFilters matches={matches} filters={filters} onChange={f => { setFilters(f); setVisibleCount(PAGE_SIZE) }} />

      {compareMode && (
        <p style={{ fontFamily: font.ui, fontSize: '0.78rem', color: color.inkMuted }}>Tap any two matches to compare them.</p>
      )}

      {/* Journal entries */}
      <div className="space-y-3">
        <AnimatePresence>
          {visible.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i}
              onOpen={() => setDetailsMatch(match)}
              onToggleFavorite={() => toggleFavorite(match)}
              selectable={compareMode}
              selected={compareSelection.includes(match.id)}
              onSelectToggle={() => toggleCompareSelect(match.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {visibleCount < filtered.length && (
        <div className="flex justify-center pt-2">
          <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ fontFamily: font.ui, color: color.inkMuted, border: `1px solid ${color.border}` }}>
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {filtered.length === 0 && matches.length > 0 && (
        <div className="py-20 text-center text-slate-500">
          <p className="text-lg font-medium">No entries match these filters</p>
          <p className="text-sm mt-1">Try a broader search or clear a filter.</p>
        </div>
      )}

      {matches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pitch-600/20 mb-6">
            <Zap className="h-8 w-8 text-pitch-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your journal is empty</h2>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            Every match becomes part of your story. Log your first one — it takes less than a minute, and your career archive starts here.
          </p>
          <Button variant="primary" size="lg" onClick={() => setFlowMode('full')}>
            <Plus className="h-4 w-4" /> Log Your First Match
          </Button>
        </div>
      )}

      {/* Details modal */}
      {detailsMatch && (
        <MatchDetails
          match={detailsMatch}
          priorMatches={priorTo(detailsMatch)}
          onClose={() => setDetailsMatch(null)}
          onEdit={() => { setEditMatch(detailsMatch); setDetailsMatch(null) }}
          onDelete={() => requestDelete(detailsMatch)}
          onToggleFavorite={() => { toggleFavorite(detailsMatch); setDetailsMatch({ ...detailsMatch, favorite: !detailsMatch.favorite }) }}
        />
      )}

      {/* Edit modal */}
      {editMatch && (
        <EditMatchModal match={editMatch} onClose={() => setEditMatch(null)}
          onSave={updated => { updateMatch(updated.id, updated); setEditMatch(null) }} />
      )}

      {/* Compare modal */}
      {comparePair && (
        <MatchCompare a={comparePair[0]} b={comparePair[1]} onClose={() => setComparePair(null)} />
      )}

      {/* Undo delete */}
      <AnimatePresence>
        {deletePending && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl"
            style={{ background: color.surface2, border: `1px solid ${color.border}` }}>
            <p style={{ fontFamily: font.ui, fontSize: '0.82rem', color: color.inkDim }}>
              Removed "vs {deletePending.match.opponent}" from your journal.
            </p>
            <button onClick={undoDelete} className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold" style={{ fontFamily: font.display, background: color.accent, color: color.bg }}>
              <Undo2 className="h-3 w-3" /> Undo
            </button>
            <button onClick={() => setDeletePending(null)} aria-label="Dismiss" style={{ color: color.inkMuted }}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
