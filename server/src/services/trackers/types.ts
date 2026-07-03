/* ═══ Tracker Integration Types ════════════════════════════════════════════
   Generic interfaces for any video tracker (Veo, Wyscout, Hudl, etc.).
   Each tracker implements these interfaces, so they can be swapped out.
*/

export type TrackerType = 'veo' | 'wyscout' | 'hudl' | 'kinexon' | 'playermaker'

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  authorizationUrl: string
  tokenUrl: string
  scope: string[]
}

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
}

export interface TrackerMatch {
  id: string
  date: string // YYYY-MM-DD
  opponent: string
  competition: string
  venue: 'home' | 'away' | 'neutral'
  teamScore?: number
  opponentScore?: number
  result?: 'win' | 'loss' | 'draw'
  position?: string
  minutesPlayed?: number
  goals?: number
  assists?: number
  shots?: number
  shotsOnTarget?: number
  passAccuracy?: number
  tackles?: number
  interceptions?: number
  distanceCovered?: number
  sprintSpeed?: number
  rating?: number
  notes?: string
  videoUrl?: string
  rawData?: Record<string, any>
}

export interface SyncResult {
  matchesSynced: number
  matchesUpdated: number
  errors: string[]
}

export interface ITracker {
  type: TrackerType
  getOAuthConfig(): OAuthConfig
  exchangeAuthCode(code: string): Promise<OAuthTokens>
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>
  getMatches(tokens: OAuthTokens, userId: string): Promise<TrackerMatch[]>
  getMatchesSince(tokens: OAuthTokens, userId: string, since: Date): Promise<TrackerMatch[]>
  validateTokens(tokens: OAuthTokens): Promise<boolean>
}
