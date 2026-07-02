/* ═══ Career match history — single source of truth ══════════════════════
   The current season's matches live in the API/mock data layer (useAppData);
   archived seasons live in localStorage (see SeasonArchive's archive flow).
   Every analytics module that needs "career-wide" data reads through this
   hook instead of re-implementing the merge, so the two never drift. */
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/hooks/useAppData'
import type { Match } from '@/types'

export interface CareerMatch extends Match {
  seasonId: string
  seasonName: string
}

export interface SeasonSummary {
  id: string
  name: string
  matches: CareerMatch[]
  isCurrent: boolean
}

function ARCHIVE_KEY(uid: string) { return `season_archive_${uid}` }

interface ArchivedSeasonRow {
  id: string
  name: string
  matches: Match[]
}

export function useCareerMatches() {
  const { user, isDemoMode } = useAuth()
  const { matches } = useAppData()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  /* Archived seasons only change via the archive flow (which reloads the
     page), so reading localStorage once per uid is safe and cheap — no
     need for a subscription/listener here. */
  const archive = useMemo<ArchivedSeasonRow[]>(() => {
    try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY(uid)) ?? '[]') } catch { return [] }
  }, [uid])

  const seasons = useMemo<SeasonSummary[]>(() => {
    const archived: SeasonSummary[] = archive.map(s => ({
      id: s.id, name: s.name, isCurrent: false,
      matches: s.matches.map(m => ({ ...m, seasonId: s.id, seasonName: s.name })),
    }))
    const current: SeasonSummary[] = matches.length > 0 ? [{
      id: 'current', name: 'Current Season', isCurrent: true,
      matches: matches.map(m => ({ ...m, seasonId: 'current', seasonName: 'Current Season' })),
    }] : []
    return [...current, ...archived]
  }, [archive, matches])

  const careerMatches = useMemo<CareerMatch[]>(() => seasons.flatMap(s => s.matches), [seasons])

  return { seasons, careerMatches, currentSeasonMatches: matches }
}
