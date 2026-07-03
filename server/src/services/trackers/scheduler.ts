/* ═══ Tracker Sync Scheduler ═══════════════════════════════════════════════
   Background job that periodically syncs matches from all active tracker
   integrations. Runs every 6 hours or can be triggered manually.
*/
import { pool } from '@/db'
import { syncTrackerMatches } from './sync'
import type { TrackerType } from './types'

export async function scheduleTrackerSync() {
  // Run sync every 6 hours
  const SIX_HOURS = 6 * 60 * 60 * 1000

  async function runSync() {
    console.log('[Trackers] Starting scheduled sync...')
    try {
      const integrations = await pool.query(
        `SELECT DISTINCT user_id, tracker_type
         FROM tracker_integrations
         WHERE is_active = true
         ORDER BY user_id, tracker_type`
      )

      for (const row of integrations.rows) {
        try {
          const stats = await syncTrackerMatches(row.user_id, row.tracker_type as TrackerType, false)
          console.log(`[Trackers] ${row.user_id}/${row.tracker_type}: synced ${stats.matchesSynced} matches`)
          if (stats.errors.length > 0) {
            console.warn(`[Trackers] Errors: ${stats.errors.join(', ')}`)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(`[Trackers] Failed to sync ${row.user_id}/${row.tracker_type}: ${msg}`)
        }
      }
      console.log('[Trackers] Scheduled sync complete')
    } catch (err) {
      console.error('[Trackers] Scheduler error:', err)
    }

    // Schedule next run
    setTimeout(runSync, SIX_HOURS)
  }

  // Start the first run after a short delay (let server stabilize)
  setTimeout(runSync, 5000)
}

/**
 * Manually trigger sync for a user across all trackers
 */
export async function syncUserAllTrackers(userId: string) {
  const integrations = await pool.query(
    `SELECT tracker_type FROM tracker_integrations
     WHERE user_id = $1 AND is_active = true`,
    [userId]
  )

  const results = []
  for (const row of integrations.rows) {
    const stats = await syncTrackerMatches(userId, row.tracker_type as TrackerType, false)
    results.push({ tracker: row.tracker_type, ...stats })
  }

  return results
}
