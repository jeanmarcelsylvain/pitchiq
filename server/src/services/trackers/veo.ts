/* ═══ Veo Tracker Integration ══════════════════════════════════════════════
   Veo is a video analysis platform with AI-powered stat tracking.
   API Docs: https://docs.veo.co/
*/
import type { ITracker, OAuthConfig, OAuthTokens, TrackerMatch, SyncResult } from './types'

const VEO_API_BASE = 'https://api.veo.co'
const VEO_AUTH_BASE = 'https://auth.veo.co'

export class VeoTracker implements ITracker {
  type = 'veo' as const

  /**
   * Get OAuth configuration. SECRET is only used server-side in token exchange.
   * Never expose SECRET to frontend or in logs.
   */
  getOAuthConfig(): OAuthConfig {
    const clientId = process.env.VEO_CLIENT_ID
    const clientSecret = process.env.VEO_CLIENT_SECRET
    const redirectUri = process.env.VEO_REDIRECT_URI

    if (!clientId || !clientSecret) {
      throw new Error('VEO_CLIENT_ID and VEO_CLIENT_SECRET must be set in environment')
    }

    return {
      clientId,
      clientSecret, // ⚠️ Only used server-side in token exchange, never sent to browser
      redirectUri: redirectUri || 'http://localhost:3001/api/trackers/veo/callback',
      authorizationUrl: `${VEO_AUTH_BASE}/oauth2/authorize`,
      tokenUrl: `${VEO_AUTH_BASE}/oauth2/token`,
      scope: ['videos:read', 'analysis:read'],
    }
  }

  async exchangeAuthCode(code: string): Promise<OAuthTokens> {
    const config = this.getOAuthConfig()
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    })

    const res = await fetch(`${VEO_AUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!res.ok) {
      // Never log the response body — it may contain secrets
      throw new Error(`Veo OAuth failed: ${res.status}`)
    }

    const data: any = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const config = this.getOAuthConfig()
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    })

    const res = await fetch(`${VEO_AUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!res.ok) {
      // Never log response — may contain sensitive data
      throw new Error(`Veo token refresh failed`)
    }

    const data: any = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    }
  }

  async validateTokens(tokens: OAuthTokens): Promise<boolean> {
    try {
      const res = await fetch(`${VEO_API_BASE}/api/v1/user/profile`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      })
      return res.ok
    } catch {
      return false
    }
  }

  async getMatches(tokens: OAuthTokens, _userId: string): Promise<TrackerMatch[]> {
    return this.fetchMatches(tokens.accessToken, null)
  }

  async getMatchesSince(tokens: OAuthTokens, _userId: string, since: Date): Promise<TrackerMatch[]> {
    return this.fetchMatches(tokens.accessToken, since)
  }

  private async fetchMatches(accessToken: string, since: Date | null): Promise<TrackerMatch[]> {
    const matches: TrackerMatch[] = []
    let pageNum = 1
    let hasMore = true

    while (hasMore) {
      const url = new URL(`${VEO_API_BASE}/api/v1/videos`)
      url.searchParams.append('page', pageNum.toString())
      url.searchParams.append('per_page', '50')
      if (since) {
        // Veo uses ISO 8601 for date filters
        url.searchParams.append('created_after', since.toISOString())
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!res.ok) {
        // ⚠️ Never log token or response body — may contain secrets
        throw new Error(`Veo API failed: ${res.status}`)
      }

      const data: any = await res.json()
      const videos = data.videos || []

      for (const video of videos) {
        const trackerMatch = this.transformVeoVideoToMatch(video)
        matches.push(trackerMatch)
      }

      hasMore = data.pagination?.has_next_page ?? false
      pageNum += 1
    }

    return matches
  }

  private transformVeoVideoToMatch(video: any): TrackerMatch {
    // Veo returns video metadata + analysis data
    // Extract match data from Veo's analysis object
    const analysis = video.analysis || {}
    const metadata = video.metadata || {}

    return {
      id: video.id,
      date: video.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      opponent: metadata.opponent || 'Unknown',
      competition: metadata.competition || '',
      venue: metadata.venue || 'neutral',
      teamScore: metadata.team_score,
      opponentScore: metadata.opponent_score,
      result: this.deriveResult(metadata.team_score, metadata.opponent_score),
      position: metadata.position,
      minutesPlayed: analysis.minutes_played || 90,
      goals: analysis.goals || 0,
      assists: analysis.assists || 0,
      shots: analysis.shots || 0,
      shotsOnTarget: analysis.shots_on_target || 0,
      passAccuracy: analysis.pass_accuracy ? parseFloat(analysis.pass_accuracy) : 0,
      tackles: analysis.tackles || 0,
      interceptions: analysis.interceptions || 0,
      distanceCovered: analysis.distance_covered || 0,
      sprintSpeed: analysis.sprint_speed || 0,
      rating: analysis.rating ? parseFloat(analysis.rating) : 7,
      notes: metadata.notes || '',
      videoUrl: video.source_url || '',
      rawData: { veo_video_id: video.id, veo_analysis: analysis },
    }
  }

  private deriveResult(
    teamScore?: number,
    opponentScore?: number
  ): 'win' | 'loss' | 'draw' | undefined {
    if (teamScore === undefined || opponentScore === undefined) return undefined
    if (teamScore > opponentScore) return 'win'
    if (teamScore < opponentScore) return 'loss'
    return 'draw'
  }
}
