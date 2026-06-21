import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { mockMatches, mockGoals, mockInsights, mockSeasonStats, mockProfile, mockTrainingSessions } from '@/lib/mockData'
import type { Match, Goal, Insight, SeasonStats, PlayerProfile, TrainingSession } from '@/types'

const emptySeasonStats: SeasonStats = {
  matches: 0, minutesPlayed: 0, goals: 0, assists: 0,
  goalsPerGame: 0, assistsPerGame: 0, avgPassAccuracy: 0,
  avgRating: 0, avgSprintSpeed: 0, totalDistance: 0, trainingSessions: 0,
}

function calcStats(matches: Match[]): SeasonStats {
  if (matches.length === 0) return emptySeasonStats
  const n = matches.length
  return {
    matches: n,
    minutesPlayed: matches.reduce((s, m) => s + m.minutesPlayed, 0),
    goals: matches.reduce((s, m) => s + m.goals, 0),
    assists: matches.reduce((s, m) => s + m.assists, 0),
    goalsPerGame: matches.reduce((s, m) => s + m.goals, 0) / n,
    assistsPerGame: matches.reduce((s, m) => s + m.assists, 0) / n,
    avgPassAccuracy: matches.reduce((s, m) => s + m.passAccuracy, 0) / n,
    avgRating: matches.reduce((s, m) => s + m.rating, 0) / n,
    avgSprintSpeed: matches.reduce((s, m) => s + m.sprintSpeed, 0) / n,
    totalDistance: matches.reduce((s, m) => s + m.distanceCovered, 0),
    trainingSessions: 0,
  }
}

// Converts snake_case DB row to camelCase Match
function rowToMatch(r: Record<string, unknown>): Match {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    date: (r.date as string).slice(0, 10),
    opponent: r.opponent as string,
    competition: (r.competition as string) ?? '',
    venue: r.venue as Match['venue'],
    result: r.result as Match['result'],
    teamScore: Number(r.team_score ?? 0),
    opponentScore: Number(r.opponent_score ?? 0),
    position: r.position as Match['position'],
    minutesPlayed: Number(r.minutes_played ?? 90),
    goals: Number(r.goals ?? 0),
    assists: Number(r.assists ?? 0),
    shots: Number(r.shots ?? 0),
    shotsOnTarget: Number(r.shots_on_target ?? 0),
    passAccuracy: Number(r.pass_accuracy ?? 0),
    tackles: Number(r.tackles ?? 0),
    interceptions: Number(r.interceptions ?? 0),
    distanceCovered: Number(r.distance_covered ?? 0),
    sprintSpeed: Number(r.sprint_speed ?? 0),
    rating: Number(r.rating ?? 7),
    notes: (r.notes as string) ?? '',
    createdAt: r.created_at as string,
  }
}

function rowToGoal(r: Record<string, unknown>): Goal {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    title: r.title as string,
    description: (r.description as string) ?? '',
    category: r.category as Goal['category'],
    targetValue: Number(r.target_value),
    currentValue: Number(r.current_value),
    unit: r.unit as string,
    deadline: r.deadline as string | undefined,
    completed: r.completed as boolean,
    createdAt: r.created_at as string,
  }
}

export function useAppData() {
  const { isDemoMode, user } = useAuth()
  const { apiFetch } = useApi()

  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  // Read localStorage as initial state (instant)
  const [matches, setMatches] = useState<Match[]>(() => {
    if (isDemoMode) return mockMatches
    try { return JSON.parse(localStorage.getItem(`matches_${uid}`) ?? '[]') } catch { return [] }
  })
  const [goals, setGoals] = useState<Goal[]>(() => {
    if (isDemoMode) return mockGoals
    try { return JSON.parse(localStorage.getItem(`goals_${uid}`) ?? '[]') } catch { return [] }
  })
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    if (isDemoMode) return mockProfile
    const saved = uid ? localStorage.getItem(`profile_${uid}`) : null
    const p = saved ? JSON.parse(saved) : null
    return {
      id: uid, userId: uid,
      name: p?.name || user?.displayName || 'Player',
      age: p?.age ? Number(p.age) : 0,
      height: 0, weight: 0,
      dominantFoot: p?.dominantFoot ?? 'right',
      primaryPosition: p?.primaryPosition ?? 'CM',
      club: p?.club ?? '',
      avatarUrl: user?.photoURL ?? undefined,
    }
  })
  const [dbLoaded, setDbLoaded] = useState(false)

  // Sync from DB in background
  useEffect(() => {
    if (isDemoMode || !user) return

    Promise.all([
      apiFetch<Record<string, unknown>[]>('/api/matches'),
      apiFetch<Record<string, unknown>[]>('/api/goals'),
      apiFetch<Record<string, unknown>>('/api/profile'),
    ]).then(([dbMatches, dbGoals, dbProfile]) => {
      if (dbMatches && dbMatches.length > 0) {
        const parsed = dbMatches.map(rowToMatch)
        setMatches(parsed)
        localStorage.setItem(`matches_${uid}`, JSON.stringify(parsed))
      }
      if (dbGoals && dbGoals.length > 0) {
        const parsed = dbGoals.map(rowToGoal)
        setGoals(parsed)
        localStorage.setItem(`goals_${uid}`, JSON.stringify(parsed))
      }
      if (dbProfile) {
        const p: PlayerProfile = {
          id: uid, userId: uid,
          name: (dbProfile.name as string) || user?.displayName || 'Player',
          age: Number(dbProfile.age ?? 0),
          height: Number(dbProfile.height ?? 0),
          weight: Number(dbProfile.weight ?? 0),
          dominantFoot: (dbProfile.dominant_foot as PlayerProfile['dominantFoot']) ?? 'right',
          primaryPosition: (dbProfile.primary_position as PlayerProfile['primaryPosition']) ?? 'CM',
          club: (dbProfile.club as string) ?? '',
          avatarUrl: user?.photoURL ?? undefined,
        }
        setProfile(p)
        localStorage.setItem(`profile_${uid}`, JSON.stringify(p))
      }
      setDbLoaded(true)
    }).catch(() => setDbLoaded(true)) // silently fall back to localStorage on error
  }, [user?.uid])

  if (isDemoMode) {
    return {
      matches: mockMatches, goals: mockGoals, insights: mockInsights,
      seasonStats: mockSeasonStats, profile: mockProfile,
      trainingSessions: mockTrainingSessions, isDemo: true, dbLoaded: true,
    }
  }

  return {
    matches, goals,
    insights: [] as Insight[],
    seasonStats: calcStats(matches),
    profile,
    trainingSessions: [] as TrainingSession[],
    isDemo: false,
    dbLoaded,
  }
}
