export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: string
}

export function computeBadges(uid: string): Badge[] {
  const matchesRaw = localStorage.getItem(`matches_${uid}`)
  const goalsRaw = localStorage.getItem(`goals_${uid}`)
  const coachRaw = localStorage.getItem(`coach_assessment_${uid}`)
  const matches = matchesRaw ? JSON.parse(matchesRaw) : []
  const goals = goalsRaw ? JSON.parse(goalsRaw) : []

  const totalGoals = matches.reduce((s: number, m: { goals: number }) => s + (m.goals ?? 0), 0)
  const totalAssists = matches.reduce((s: number, m: { assists: number }) => s + (m.assists ?? 0), 0)

  // Check login streak from localStorage
  const streakRaw = localStorage.getItem(`streak_${uid}`)
  const streak = streakRaw ? JSON.parse(streakRaw) as { count: number; lastDate: string } : { count: 0, lastDate: '' }

  const definitions: Omit<Badge, 'earned' | 'earnedAt'>[] = [
    { id: 'first_match', name: 'First Kick', description: 'Log your first match', icon: '⚽' },
    { id: 'five_matches', name: 'On a Roll', description: 'Log 5 matches', icon: '🔥' },
    { id: 'ten_matches', name: 'Consistent', description: 'Log 10 matches', icon: '📊' },
    { id: 'twenty_five_matches', name: 'Veteran', description: 'Log 25 matches', icon: '🏆' },
    { id: 'first_goal', name: 'Clinical', description: 'Score your first tracked goal', icon: '🎯' },
    { id: 'ten_goals', name: 'Lethal', description: 'Score 10 tracked goals', icon: '💥' },
    { id: 'first_assist', name: 'Playmaker', description: 'Log your first assist', icon: '🎨' },
    { id: 'five_assists', name: 'Vision', description: 'Log 5 assists', icon: '👁️' },
    { id: 'first_goal_set', name: 'Ambitious', description: 'Set your first season goal', icon: '🎖️' },
    { id: 'ai_assessed', name: 'Self Aware', description: 'Complete the AI Coach assessment', icon: '🤖' },
    { id: 'week_streak', name: '7-Day Grinder', description: 'Log activity 7 days in a row', icon: '💪' },
    { id: 'perfect_rating', name: 'Perfect Game', description: 'Log a 10/10 rated match', icon: '⭐' },
  ]

  const earnedMap: Record<string, boolean> = {
    first_match: matches.length >= 1,
    five_matches: matches.length >= 5,
    ten_matches: matches.length >= 10,
    twenty_five_matches: matches.length >= 25,
    first_goal: totalGoals >= 1,
    ten_goals: totalGoals >= 10,
    first_assist: totalAssists >= 1,
    five_assists: totalAssists >= 5,
    first_goal_set: goals.length >= 1,
    ai_assessed: !!coachRaw,
    week_streak: streak.count >= 7,
    perfect_rating: matches.some((m: { rating: number }) => m.rating >= 10),
  }

  return definitions.map(d => ({ ...d, earned: earnedMap[d.id] ?? false }))
}

export function updateStreak(uid: string) {
  const key = `streak_${uid}`
  const raw = localStorage.getItem(key)
  const today = new Date().toISOString().slice(0, 10)
  if (!raw) {
    localStorage.setItem(key, JSON.stringify({ count: 1, lastDate: today }))
    return
  }
  const streak = JSON.parse(raw) as { count: number; lastDate: string }
  const last = new Date(streak.lastDate)
  const now = new Date(today)
  const diffDays = Math.round((now.getTime() - last.getTime()) / 86400000)
  if (diffDays === 0) return
  if (diffDays === 1) {
    localStorage.setItem(key, JSON.stringify({ count: streak.count + 1, lastDate: today }))
  } else {
    localStorage.setItem(key, JSON.stringify({ count: 1, lastDate: today }))
  }
}
