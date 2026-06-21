import type { Match, Goal, TrainingSession, PlayerProfile, Insight, SeasonStats } from '@/types'

export const mockProfile: PlayerProfile = {
  id: '1',
  userId: 'demo-user',
  name: 'Alex Rivera',
  age: 18,
  height: 178,
  weight: 72,
  dominantFoot: 'right',
  primaryPosition: 'CM',
  secondaryPosition: 'CAM',
  club: 'FC United Academy',
  jerseyNumber: 8,
  nationality: 'USA',
  bio: 'Central midfielder with a focus on technical play and game intelligence.',
}

export const mockMatches: Match[] = [
  {
    id: '1', userId: 'demo-user', date: '2024-01-06', opponent: 'Riverview FC', competition: 'ECNL Regional',
    venue: 'home', result: 'win', teamScore: 3, opponentScore: 1, position: 'CM',
    minutesPlayed: 90, goals: 1, assists: 2, shots: 4, shotsOnTarget: 2,
    passAccuracy: 87, tackles: 5, interceptions: 3, distanceCovered: 11.2, sprintSpeed: 31.4, rating: 8.5,
    notes: 'Best game of the season. Controlled midfield all match.', createdAt: '2024-01-06T20:00:00Z',
  },
  {
    id: '2', userId: 'demo-user', date: '2023-12-30', opponent: 'Metro United', competition: 'ECNL Regional',
    venue: 'away', result: 'draw', teamScore: 1, opponentScore: 1, position: 'CM',
    minutesPlayed: 85, goals: 0, assists: 1, shots: 2, shotsOnTarget: 1,
    passAccuracy: 82, tackles: 7, interceptions: 4, distanceCovered: 10.8, sprintSpeed: 30.9, rating: 7.0,
    notes: 'Tough away game. High press from opponent disrupted our rhythm.', createdAt: '2023-12-30T20:00:00Z',
  },
  {
    id: '3', userId: 'demo-user', date: '2023-12-23', opponent: 'Eastside SC', competition: 'State Cup',
    venue: 'neutral', result: 'win', teamScore: 2, opponentScore: 0, position: 'CAM',
    minutesPlayed: 90, goals: 1, assists: 1, shots: 5, shotsOnTarget: 3,
    passAccuracy: 84, tackles: 3, interceptions: 2, distanceCovered: 11.5, sprintSpeed: 32.1, rating: 8.0,
    notes: 'Played higher up as a 10. Felt natural.', createdAt: '2023-12-23T20:00:00Z',
  },
  {
    id: '4', userId: 'demo-user', date: '2023-12-16', opponent: 'Highland FC', competition: 'ECNL Regional',
    venue: 'home', result: 'win', teamScore: 4, opponentScore: 2, position: 'CM',
    minutesPlayed: 90, goals: 2, assists: 0, shots: 6, shotsOnTarget: 4,
    passAccuracy: 79, tackles: 4, interceptions: 3, distanceCovered: 10.9, sprintSpeed: 30.2, rating: 8.2,
    notes: 'Two goals from set pieces. Need to improve open-play pass accuracy.', createdAt: '2023-12-16T20:00:00Z',
  },
  {
    id: '5', userId: 'demo-user', date: '2023-12-09', opponent: 'Bay City FC', competition: 'ECNL Regional',
    venue: 'away', result: 'loss', teamScore: 0, opponentScore: 2, position: 'CM',
    minutesPlayed: 75, goals: 0, assists: 0, shots: 1, shotsOnTarget: 0,
    passAccuracy: 74, tackles: 6, interceptions: 2, distanceCovered: 9.8, sprintSpeed: 29.8, rating: 5.5,
    notes: 'Poor performance. High-intensity match but could not create chances.', createdAt: '2023-12-09T20:00:00Z',
  },
  {
    id: '6', userId: 'demo-user', date: '2023-12-02', opponent: 'Coastal United', competition: 'Friendly',
    venue: 'home', result: 'win', teamScore: 3, opponentScore: 0, position: 'CM',
    minutesPlayed: 60, goals: 0, assists: 2, shots: 2, shotsOnTarget: 1,
    passAccuracy: 89, tackles: 3, interceptions: 1, distanceCovered: 7.2, sprintSpeed: 30.5, rating: 7.8,
    notes: 'Only played 60 mins but felt sharp. High pass accuracy.', createdAt: '2023-12-02T20:00:00Z',
  },
  {
    id: '7', userId: 'demo-user', date: '2023-11-25', opponent: 'Northside Academy', competition: 'ECNL Regional',
    venue: 'away', result: 'win', teamScore: 2, opponentScore: 1, position: 'CDM',
    minutesPlayed: 90, goals: 0, assists: 1, shots: 1, shotsOnTarget: 0,
    passAccuracy: 86, tackles: 9, interceptions: 5, distanceCovered: 12.1, sprintSpeed: 29.5, rating: 7.5,
    notes: 'Played deeper as CDM. More defensive work but key interceptions.', createdAt: '2023-11-25T20:00:00Z',
  },
  {
    id: '8', userId: 'demo-user', date: '2023-11-18', opponent: 'Parkview SC', competition: 'ECNL Regional',
    venue: 'home', result: 'win', teamScore: 5, opponentScore: 1, position: 'CAM',
    minutesPlayed: 90, goals: 3, assists: 1, shots: 7, shotsOnTarget: 5,
    passAccuracy: 81, tackles: 2, interceptions: 1, distanceCovered: 11.0, sprintSpeed: 31.8, rating: 9.5,
    notes: 'Hat trick game! Felt unstoppable in the final third.', createdAt: '2023-11-18T20:00:00Z',
  },
]

export const mockTrainingSessions: TrainingSession[] = [
  { id: '1', userId: 'demo-user', date: '2024-01-07', type: 'technical', duration: 90, intensity: 4, focus: ['Passing', 'First Touch'], createdAt: '2024-01-07T10:00:00Z' },
  { id: '2', userId: 'demo-user', date: '2024-01-05', type: 'fitness', duration: 60, intensity: 5, focus: ['Sprint Training', 'Stamina'], createdAt: '2024-01-05T09:00:00Z' },
  { id: '3', userId: 'demo-user', date: '2024-01-04', type: 'team', duration: 90, intensity: 3, focus: ['Tactical Shape', 'Set Pieces'], createdAt: '2024-01-04T17:00:00Z' },
  { id: '4', userId: 'demo-user', date: '2024-01-02', type: 'individual', duration: 45, intensity: 3, focus: ['Shooting', 'Finishing'], createdAt: '2024-01-02T11:00:00Z' },
  { id: '5', userId: 'demo-user', date: '2023-12-28', type: 'technical', duration: 75, intensity: 4, focus: ['Dribbling', 'Ball Control'], createdAt: '2023-12-28T10:00:00Z' },
  { id: '6', userId: 'demo-user', date: '2023-12-26', type: 'team', duration: 90, intensity: 3, focus: ['Pressing', 'Counter Attack'], createdAt: '2023-12-26T17:00:00Z' },
]

export const mockGoals: Goal[] = [
  { id: '1', userId: 'demo-user', title: 'Score 15 Goals This Season', description: 'Hit double digits and reach 15 total goals', category: 'scoring', targetValue: 15, currentValue: 7, unit: 'goals', deadline: '2024-05-31', completed: false, createdAt: '2023-09-01T00:00:00Z' },
  { id: '2', userId: 'demo-user', title: 'Maintain 85% Pass Accuracy', description: 'Consistently hit above 85% pass accuracy across matches', category: 'passing', targetValue: 85, currentValue: 83, unit: '%', completed: false, createdAt: '2023-09-01T00:00:00Z' },
  { id: '3', userId: 'demo-user', title: 'Train 4x Per Week', description: 'Build discipline with consistent weekly training', category: 'training', targetValue: 4, currentValue: 3.5, unit: 'sessions/week', completed: false, createdAt: '2023-09-01T00:00:00Z' },
  { id: '4', userId: 'demo-user', title: 'Play 1,000 Minutes', description: 'Accumulate 1,000 minutes of competitive match time', category: 'minutes', targetValue: 1000, currentValue: 670, unit: 'minutes', deadline: '2024-05-31', completed: false, createdAt: '2023-09-01T00:00:00Z' },
  { id: '5', userId: 'demo-user', title: 'Reach 32 km/h Sprint Speed', description: 'Improve top speed to 32 km/h through sprint training', category: 'fitness', targetValue: 32, currentValue: 31.4, unit: 'km/h', completed: false, createdAt: '2023-09-01T00:00:00Z' },
  { id: '6', userId: 'demo-user', title: 'Record 10 Assists', description: 'Become the key creator with 10 assists this season', category: 'scoring', targetValue: 10, currentValue: 8, unit: 'assists', deadline: '2024-05-31', completed: false, createdAt: '2023-09-01T00:00:00Z' },
]

export const mockInsights: Insight[] = [
  {
    id: '1', userId: 'demo-user', type: 'improvement',
    title: 'Sprint Speed Up 6.3%',
    body: 'Your average sprint speed has increased from 29.6 km/h to 31.4 km/h over the last 4 matches — a 6.3% improvement.',
    metric: 'sprintSpeed', changePercent: 6.3, generatedAt: '2024-01-07T08:00:00Z', read: false,
  },
  {
    id: '2', userId: 'demo-user', type: 'achievement',
    title: 'Hat Trick vs Parkview SC',
    body: 'Your 3-goal, 1-assist performance (rated 9.5/10) against Parkview SC is your best single-match output this season.',
    metric: 'goals', generatedAt: '2023-11-18T22:00:00Z', read: true,
  },
  {
    id: '3', userId: 'demo-user', type: 'trend',
    title: 'CAM Outperforms CM',
    body: 'When playing CAM, your average rating is 8.75 vs 7.3 at CM. You also average more goals (1.5 vs 0.5) in the #10 role.',
    metric: 'rating', generatedAt: '2024-01-05T08:00:00Z', read: false,
  },
  {
    id: '4', userId: 'demo-user', type: 'warning',
    title: 'Pass Accuracy Below Target',
    body: 'Your pass accuracy (83% avg) is 2 points below your 85% goal. Focus on shorter, higher-percentage passes when under pressure.',
    metric: 'passAccuracy', generatedAt: '2024-01-06T08:00:00Z', read: false,
  },
  {
    id: '5', userId: 'demo-user', type: 'improvement',
    title: 'Assists on Track for Record Season',
    body: 'With 8 assists in 8 matches (1.0 per game), you\'re on pace to shatter your personal record of 12 assists last season.',
    metric: 'assists', changePercent: 33, generatedAt: '2024-01-06T08:00:00Z', read: false,
  },
]

export const mockSeasonStats: SeasonStats = {
  matches: 8,
  minutesPlayed: 670,
  goals: 7,
  assists: 8,
  goalsPerGame: 0.88,
  assistsPerGame: 1.0,
  avgPassAccuracy: 83,
  avgRating: 7.75,
  avgSprintSpeed: 30.8,
  totalDistance: 84.5,
  trainingSessions: 18,
}
