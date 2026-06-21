import { useAuth } from '@/hooks/useAuth'
import { mockMatches, mockGoals, mockInsights, mockSeasonStats, mockProfile, mockTrainingSessions } from '@/lib/mockData'
import type { Match, Goal, Insight, SeasonStats, PlayerProfile, TrainingSession } from '@/types'

const emptySeasonStats: SeasonStats = {
  matches: 0, minutesPlayed: 0, goals: 0, assists: 0,
  goalsPerGame: 0, assistsPerGame: 0, avgPassAccuracy: 0,
  avgRating: 0, avgSprintSpeed: 0, totalDistance: 0, trainingSessions: 0,
}

export function useAppData() {
  const { isDemoMode, user } = useAuth()

  if (isDemoMode) {
    return {
      matches: mockMatches,
      goals: mockGoals,
      insights: mockInsights,
      seasonStats: mockSeasonStats,
      profile: mockProfile,
      trainingSessions: mockTrainingSessions,
      isDemo: true,
    }
  }

  const savedProfile = user
    ? localStorage.getItem(`profile_${user.uid}`)
    : null

  const parsedProfile = savedProfile ? JSON.parse(savedProfile) : null

  const realProfile: PlayerProfile = {
    id: user?.uid ?? '1',
    userId: user?.uid ?? '1',
    name: parsedProfile?.name || user?.displayName || 'Player',
    age: parsedProfile?.age ? Number(parsedProfile.age) : 0,
    height: 0,
    weight: 0,
    dominantFoot: parsedProfile?.dominantFoot ?? 'right',
    primaryPosition: parsedProfile?.primaryPosition ?? 'CM',
    club: parsedProfile?.club ?? '',
    avatarUrl: user?.photoURL ?? undefined,
  }

  const savedMatches = user
    ? JSON.parse(localStorage.getItem(`matches_${user.uid}`) ?? '[]') as Match[]
    : []

  const savedGoals = user
    ? JSON.parse(localStorage.getItem(`goals_${user.uid}`) ?? '[]') as Goal[]
    : []

  const realStats: SeasonStats = savedMatches.length === 0 ? emptySeasonStats : {
    matches: savedMatches.length,
    minutesPlayed: savedMatches.reduce((s, m) => s + m.minutesPlayed, 0),
    goals: savedMatches.reduce((s, m) => s + m.goals, 0),
    assists: savedMatches.reduce((s, m) => s + m.assists, 0),
    goalsPerGame: savedMatches.reduce((s, m) => s + m.goals, 0) / savedMatches.length,
    assistsPerGame: savedMatches.reduce((s, m) => s + m.assists, 0) / savedMatches.length,
    avgPassAccuracy: savedMatches.reduce((s, m) => s + m.passAccuracy, 0) / savedMatches.length,
    avgRating: savedMatches.reduce((s, m) => s + m.rating, 0) / savedMatches.length,
    avgSprintSpeed: savedMatches.reduce((s, m) => s + m.sprintSpeed, 0) / savedMatches.length,
    totalDistance: savedMatches.reduce((s, m) => s + m.distanceCovered, 0),
    trainingSessions: 0,
  }

  return {
    matches: savedMatches,
    goals: savedGoals,
    insights: [] as Insight[],
    seasonStats: realStats,
    profile: realProfile,
    trainingSessions: [] as TrainingSession[],
    isDemo: false,
  }
}
