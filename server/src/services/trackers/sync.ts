/* ═══ Tracker Sync Service ═════════════════════════════════════════════════
   Pulls matches from tracker APIs and syncs them into PitchIQ's match table.
   Handles OAuth refresh, conflict resolution, and sync history.
*/
import { pool } from '@/db'
import { getTracker, type TrackerMatch, type TrackerType } from './index'
import { getEncryption } from '@/services/encryption'

export interface SyncStats {
  matchesSynced: number
  matchesUpdated: number
  matchesCreated: number
  errors: string[]
}

/**
 * Sync all matches from a tracker for a user
 */
export async function syncTrackerMatches(
  userId: string,
  trackerType: TrackerType,
  fullSync: boolean = false
): Promise<SyncStats> {
  const stats: SyncStats = {
    matchesSynced: 0,
    matchesUpdated: 0,
    matchesCreated: 0,
    errors: [],
  }

  try {
    // Get tracker integration
    const integration = await getTrackerIntegration(userId, trackerType)
    if (!integration) {
      throw new Error(`No ${trackerType} integration found for user`)
    }

    // Refresh token if expired
    const tokens = await ensureValidTokens(integration)

    // Get tracker instance and fetch matches
    const tracker = getTracker(trackerType)
    const trackerMatches = fullSync
      ? await tracker.getMatches(tokens, userId)
      : await tracker.getMatchesSince(tokens, userId, integration.last_synced_at || new Date(0))

    // Create sync history record
    const syncId = await createSyncRecord(userId, trackerType, 'pending')

    // Process each match
    for (const trackerMatch of trackerMatches) {
      try {
        await syncMatchData(userId, trackerType, trackerMatch, syncId)
        stats.matchesSynced += 1

        // Determine if new or update
        const existing = await findExistingMatch(userId, trackerType, trackerMatch.id)
        if (existing) {
          stats.matchesUpdated += 1
        } else {
          stats.matchesCreated += 1
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        stats.errors.push(`Match ${trackerMatch.id}: ${msg}`)
      }
    }

    // Update sync history
    await updateSyncRecord(syncId, 'success', stats)

    // Update last sync time
    await updateIntegrationLastSync(userId, trackerType)

    return stats
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    stats.errors.push(msg)
    return stats
  }
}

/**
 * Store a match from a tracker into the matches table
 */
async function syncMatchData(
  userId: string,
  trackerType: TrackerType,
  trackerMatch: TrackerMatch,
  syncId: string
): Promise<void> {
  const client = await pool.connect()
  try {
    // Check if match already exists
    const existing = await findExistingMatch(userId, trackerType, trackerMatch.id)

    if (existing) {
      // Update existing match
      await client.query(
        `UPDATE matches SET
          opponent = $1, competition = $2, venue = $3, result = $4,
          team_score = $5, opponent_score = $6, position = $7, minutes_played = $8,
          goals = $9, assists = $10, shots = $11, shots_on_target = $12,
          pass_accuracy = $13, tackles = $14, interceptions = $15,
          distance_covered = $16, sprint_speed = $17, rating = $18, notes = $19,
          tracker_sync_id = $20
         WHERE id = $21`,
        [
          trackerMatch.opponent,
          trackerMatch.competition || '',
          trackerMatch.venue || 'neutral',
          trackerMatch.result || null,
          trackerMatch.teamScore || null,
          trackerMatch.opponentScore || null,
          trackerMatch.position || '',
          trackerMatch.minutesPlayed || 90,
          trackerMatch.goals || 0,
          trackerMatch.assists || 0,
          trackerMatch.shots || 0,
          trackerMatch.shotsOnTarget || 0,
          trackerMatch.passAccuracy || 0,
          trackerMatch.tackles || 0,
          trackerMatch.interceptions || 0,
          trackerMatch.distanceCovered || 0,
          trackerMatch.sprintSpeed || 0,
          trackerMatch.rating || 7,
          trackerMatch.notes || '',
          syncId,
          existing.id,
        ]
      )
    } else {
      // Insert new match
      await client.query(
        `INSERT INTO matches (
          user_id, date, opponent, competition, venue, result,
          team_score, opponent_score, position, minutes_played,
          goals, assists, shots, shots_on_target, pass_accuracy,
          tackles, interceptions, distance_covered, sprint_speed, rating, notes,
          tracker_source, tracker_match_id, tracker_sync_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
        [
          userId,
          trackerMatch.date,
          trackerMatch.opponent,
          trackerMatch.competition || '',
          trackerMatch.venue || 'neutral',
          trackerMatch.result || null,
          trackerMatch.teamScore || null,
          trackerMatch.opponentScore || null,
          trackerMatch.position || '',
          trackerMatch.minutesPlayed || 90,
          trackerMatch.goals || 0,
          trackerMatch.assists || 0,
          trackerMatch.shots || 0,
          trackerMatch.shotsOnTarget || 0,
          trackerMatch.passAccuracy || 0,
          trackerMatch.tackles || 0,
          trackerMatch.interceptions || 0,
          trackerMatch.distanceCovered || 0,
          trackerMatch.sprintSpeed || 0,
          trackerMatch.rating || 7,
          trackerMatch.notes || '',
          trackerType,
          trackerMatch.id,
          syncId,
        ]
      )
    }
  } finally {
    client.release()
  }
}

async function findExistingMatch(
  userId: string,
  trackerType: TrackerType,
  trackerId: string
): Promise<{ id: string } | null> {
  const res = await pool.query(
    'SELECT id FROM matches WHERE user_id = $1 AND tracker_source = $2 AND tracker_match_id = $3 LIMIT 1',
    [userId, trackerType, trackerId]
  )
  return res.rows[0] || null
}

async function getTrackerIntegration(userId: string, trackerType: TrackerType): Promise<any> {
  const res = await pool.query(
    'SELECT * FROM tracker_integrations WHERE user_id = $1 AND tracker_type = $2 AND is_active = true LIMIT 1',
    [userId, trackerType]
  )
  return res.rows[0] || null
}

async function ensureValidTokens(integration: any): Promise<any> {
  const encryption = getEncryption()

  // Decrypt stored tokens
  let accessToken = integration.oauth_token
  let refreshToken = integration.refresh_token

  try {
    accessToken = encryption.decrypt(accessToken)
    if (refreshToken) {
      refreshToken = encryption.decrypt(refreshToken)
    }
  } catch (err) {
    // ⚠️ Never log the error detail — may contain token information
    throw new Error('Failed to decrypt stored tokens')
  }

  // Check if token is expired
  if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
    if (!refreshToken) {
      throw new Error('Token expired and no refresh token available')
    }

    // Refresh the token
    const tracker = getTracker(integration.tracker_type)
    const newTokens = await tracker.refreshAccessToken(refreshToken)

    // Encrypt and store new tokens
    const encryptedAccessToken = encryption.encrypt(newTokens.accessToken)
    const encryptedRefreshToken = newTokens.refreshToken ? encryption.encrypt(newTokens.refreshToken) : encryption.encrypt(refreshToken)

    await pool.query(
      `UPDATE tracker_integrations SET
        oauth_token = $1, refresh_token = $2, token_expires_at = $3
       WHERE id = $4`,
      [encryptedAccessToken, encryptedRefreshToken, newTokens.expiresAt, integration.id]
    )

    return newTokens
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: integration.token_expires_at,
  }
}

async function createSyncRecord(userId: string, trackerType: TrackerType, status: string): Promise<string> {
  const res = await pool.query(
    `INSERT INTO tracker_sync_history (user_id, tracker_type, sync_type, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userId, trackerType, 'incremental', status]
  )
  return res.rows[0].id
}

async function updateSyncRecord(syncId: string, status: string, stats: SyncStats): Promise<void> {
  await pool.query(
    `UPDATE tracker_sync_history SET
      status = $1, matches_synced = $2, matches_updated = $3, completed_at = NOW()
     WHERE id = $4`,
    [status, stats.matchesSynced, stats.matchesUpdated, syncId]
  )
}

async function updateIntegrationLastSync(userId: string, trackerType: TrackerType): Promise<void> {
  await pool.query(
    `UPDATE tracker_integrations SET last_synced_at = NOW()
     WHERE user_id = $1 AND tracker_type = $2`,
    [userId, trackerType]
  )
}
