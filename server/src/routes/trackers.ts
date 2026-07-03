/* ═══ Tracker Integration Routes ═══════════════════════════════════════════
   OAuth flows, sync management, and integration status endpoints.
*/
import { Router, type Response } from 'express'
import { pool } from '@/db'
import { getTracker, type TrackerType } from '@/services/trackers'
import { syncTrackerMatches } from '@/services/trackers/sync'
import { requireAuth, type AuthRequest } from '@/middleware/auth'
import { getEncryption } from '@/services/encryption'

const router = Router()

/**
 * GET /api/trackers/available
 * List supported tracker types
 */
router.get('/available', (req: AuthRequest, res: Response) => {
  const trackers = [
    { type: 'veo', name: 'Veo', description: 'AI-powered video analysis' },
    { type: 'wyscout', name: 'Wyscout', description: 'Professional video platform', available: false },
    { type: 'hudl', name: 'Hudl', description: 'Video review platform', available: false },
  ]
  res.json(trackers)
})

/**
 * GET /api/trackers/status
 * Get user's connected trackers and sync status
 */
router.get('/status', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const integrations = await pool.query(
      `SELECT id, tracker_type, is_active, last_synced_at, created_at
       FROM tracker_integrations
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    const status = integrations.rows.map((row: any) => ({
      trackerId: row.id,
      type: row.tracker_type,
      isActive: row.is_active,
      lastSyncedAt: row.last_synced_at,
      connectedAt: row.created_at,
    }))

    res.json(status)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tracker status' })
  }
})

/**
 * POST /api/trackers/:type/authorize
 * Get OAuth authorization URL for a tracker
 */
router.post('/:type/authorize', (req: AuthRequest, res: Response) => {
  const { type } = req.params

  try {
    const tracker = getTracker(type as TrackerType)
    const config = tracker.getOAuthConfig()

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope.join(' '),
      state: Math.random().toString(36).substring(7),
    })

    const authUrl = `${config.authorizationUrl}?${params.toString()}`
    res.json({ url: authUrl })
  } catch (err) {
    res.status(400).json({ error: `Invalid tracker type: ${req.params.type}` })
  }
})

/**
 * GET /api/trackers/:type/callback
 * OAuth callback for a tracker
 */
router.get('/:type/callback', async (req: AuthRequest, res: Response) => {
  const { type } = req.params
  const { code, state, error } = req.query
  const userId = req.query.user_id as string

  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id parameter' })
  }

  if (error) {
    return res.status(400).json({ error: `OAuth error: ${error}` })
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' })
  }

  try {
    const tracker = getTracker(type as TrackerType)
    const tokens = await tracker.exchangeAuthCode(code as string)

    // Validate tokens
    const isValid = await tracker.validateTokens(tokens)
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid tokens from tracker' })
    }

    // Encrypt tokens before storage
    const encryption = getEncryption()
    const encryptedAccessToken = encryption.encrypt(tokens.accessToken)
    const encryptedRefreshToken = tokens.refreshToken ? encryption.encrypt(tokens.refreshToken) : null

    // Store integration in database
    await pool.query(
      `INSERT INTO tracker_integrations
        (user_id, tracker_type, oauth_token, refresh_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, tracker_type) DO UPDATE SET
        oauth_token = $3, refresh_token = $4, token_expires_at = $5, is_active = true, updated_at = NOW()`,
      [userId, type, encryptedAccessToken, encryptedRefreshToken, tokens.expiresAt]
    )

    // Trigger a sync
    await syncTrackerMatches(userId, type as TrackerType, true)

    // Redirect to success page
    res.redirect(
      `${process.env.CLIENT_ORIGIN}/settings?tracker=${type}&status=connected`
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.redirect(
      `${process.env.CLIENT_ORIGIN}/settings?tracker=${type}&status=failed&error=${encodeURIComponent(msg)}`
    )
  }
})

/**
 * POST /api/trackers/:type/sync
 * Manually trigger a sync for a tracker
 */
router.post('/:type/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  const { type } = req.params

  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const stats = await syncTrackerMatches(userId, type as TrackerType, false)
    res.json({
      success: true,
      stats: {
        synced: stats.matchesSynced,
        created: stats.matchesCreated,
        updated: stats.matchesUpdated,
        errors: stats.errors,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Sync failed' })
  }
})

/**
 * POST /api/trackers/:type/disconnect
 * Disconnect a tracker integration
 */
router.post('/:type/disconnect', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  const { type } = req.params

  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await pool.query(
      `UPDATE tracker_integrations SET is_active = false WHERE user_id = $1 AND tracker_type = $2`,
      [userId, type]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect tracker' })
  }
})

/**
 * GET /api/trackers/sync-history
 * View sync history for debugging
 */
router.get('/sync-history', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const history = await pool.query(
      `SELECT * FROM tracker_sync_history
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT 50`,
      [userId]
    )
    res.json(history.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sync history' })
  }
})

export default router
