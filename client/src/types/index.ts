export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: string
}

export interface PlayerProfile {
  id: string
  userId: string
  name: string
  age: number
  height: number
  weight: number
  dominantFoot: 'left' | 'right' | 'both'
  primaryPosition: Position
  secondaryPosition?: Position
  club: string
  jerseyNumber?: number
  nationality?: string
  bio?: string
  avatarUrl?: string
}

export type Position =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'CF'
  | 'ST'

export interface MatchReflection {
  confidence?: number       // 1-10
  energy?: number           // 1-10
  focus?: number            // 1-10
  enjoyment?: number        // 1-10
  fatigue?: number          // 1-10
  mentalSharpness?: number  // 1-10
  playedNaturalPosition?: boolean
  completedObjective?: boolean
  teamExecutedPlan?: boolean
  aiFocusRequest?: string
  takeaway?: string
}

export interface Match {
  id: string
  userId: string
  date: string
  opponent: string
  competition: string
  venue: 'home' | 'away' | 'neutral'
  result?: 'win' | 'loss' | 'draw'
  teamScore?: number
  opponentScore?: number
  position: Position
  minutesPlayed: number
  goals: number
  assists: number
  shots: number
  shotsOnTarget: number
  passAccuracy: number
  tackles: number
  interceptions: number
  distanceCovered: number
  sprintSpeed: number
  rating: number
  notes?: string
  createdAt: string
  /* Optional — captured by the Match Journal's Reflection step. Stored
     alongside the match so future AI features (mood trends, fatigue
     patterns, performance-under-pressure) can read it without a schema
     migration. Never required, never fabricated if absent. */
  reflection?: MatchReflection
}

export interface TrainingSession {
  id: string
  userId: string
  date: string
  type: 'team' | 'individual' | 'fitness' | 'technical' | 'tactical'
  duration: number
  intensity: 1 | 2 | 3 | 4 | 5
  focus: string[]
  notes?: string
  createdAt: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  description?: string
  category: 'scoring' | 'passing' | 'fitness' | 'minutes' | 'training' | 'custom'
  targetValue: number
  currentValue: number
  unit: string
  deadline?: string
  completed: boolean
  createdAt: string
}

export interface Insight {
  id: string
  userId: string
  type: 'improvement' | 'warning' | 'achievement' | 'trend'
  title: string
  body: string
  metric?: string
  changePercent?: number
  generatedAt: string
  read: boolean
}

export interface SeasonStats {
  matches: number
  minutesPlayed: number
  goals: number
  assists: number
  goalsPerGame: number
  assistsPerGame: number
  avgPassAccuracy: number
  avgRating: number
  avgSprintSpeed: number
  totalDistance: number
  trainingSessions: number
}

export interface DashboardData {
  weeklyStats: {
    sessions: number
    minutes: number
    goals: number
    assists: number
  }
  recentMatches: Match[]
  insights: Insight[]
  seasonStats: SeasonStats
  goalProgress: Goal[]
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}
