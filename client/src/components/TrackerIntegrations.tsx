/* ═══ Tracker Integrations Manager ═════════════════════════════════════════
   UI to connect/disconnect video trackers (Veo, Wyscout, etc.) and manage
   automatic match sync from those platforms.

   ⚠️ SECURITY: This component never handles OAuth secrets.
   - Frontend calls /api/trackers/:type/authorize (server-side endpoint)
   - Server returns a public OAuth URL (no secrets exposed)
   - Frontend opens OAuth flow in a popup window
   - Server handles token exchange and encryption at /callback
   - Frontend never sees access_token or refresh_token
*/
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, RefreshCw, Link2, Loader } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'

const BC = { fontFamily: font.display }
const B = { fontFamily: font.ui }

interface TrackerStatus {
  type: string
  name: string
  description: string
  connected: boolean
  lastSyncedAt?: string
  isLoading?: boolean
}

export function TrackerIntegrations() {
  const [trackers, setTrackers] = useState<TrackerStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    fetchTrackerStatus()
  }, [])

  const fetchTrackerStatus = async () => {
    try {
      const [availRes, statusRes] = await Promise.all([
        fetch('/api/trackers/available'),
        fetch('/api/trackers/status'),
      ])

      const available = await availRes.json()
      const connected = await statusRes.json()

      const trackerMap = new Map(connected.map((t: any) => [t.type, t]))

      const merged = available.map((t: any) => ({
        ...t,
        connected: trackerMap.has(t.type),
        lastSyncedAt: trackerMap.get(t.type)?.lastSyncedAt,
      }))

      setTrackers(merged)
    } catch (err) {
      console.error('Failed to fetch tracker status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (type: string) => {
    try {
      const res = await fetch(`/api/trackers/${type}/authorize`, { method: 'POST' })
      const data = await res.json()

      // Open OAuth flow in a popup
      const width = 500
      const height = 600
      const left = window.innerWidth / 2 - width / 2
      const top = window.innerHeight / 2 - height / 2

      window.open(
        data.url + `&user_id=${encodeURIComponent(localStorage.getItem('uid') || '')}`,
        `${type}-auth`,
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Poll for status change
      setTimeout(() => fetchTrackerStatus(), 2000)
    } catch (err) {
      console.error(`Failed to connect ${type}:`, err)
    }
  }

  const handleDisconnect = async (type: string) => {
    if (!confirm(`Disconnect ${type}? Existing synced data will remain.`)) return

    try {
      await fetch(`/api/trackers/${type}/disconnect`, { method: 'POST' })
      fetchTrackerStatus()
    } catch (err) {
      console.error(`Failed to disconnect ${type}:`, err)
    }
  }

  const handleSync = async (type: string) => {
    setSyncing(type)
    try {
      const res = await fetch(`/api/trackers/${type}/sync`, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        fetchTrackerStatus()
      }
    } catch (err) {
      console.error(`Failed to sync ${type}:`, err)
    } finally {
      setSyncing(null)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <p style={{ ...B, color: color.inkMuted }}>Loading tracker status...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.2em', color: color.inkMuted }} className="uppercase mb-2">
          Video Trackers
        </p>
        <h3 className="font-display text-lg font-bold text-white">Auto-sync match data</h3>
        <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }} className="mt-1">
          Connect video platforms like Veo or Wyscout to automatically pull match stats into PitchIQ.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="wait">
          {trackers.map(tracker => (
            <motion.div
              key={tracker.type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="rounded-xl p-4"
              style={{
                background: color.surface,
                border: `1px solid ${color.border}`,
              }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 style={{ ...BC, fontSize: '0.9rem', fontWeight: 700, color: color.ink }}>
                    {tracker.name}
                  </h4>
                  <p style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }} className="mt-0.5">
                    {tracker.description}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: tracker.connected ? 'rgba(45,212,160,0.12)' : 'rgba(255,255,255,0.06)',
                    color: tracker.connected ? color.emerald : color.inkMuted,
                  }}>
                  {tracker.connected ? (
                    <>
                      <Check className="h-3 w-3" /> Connected
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3 w-3" /> Disconnected
                    </>
                  )}
                </div>
              </div>

              {tracker.connected && tracker.lastSyncedAt && (
                <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }} className="mb-3">
                  Last synced: {new Date(tracker.lastSyncedAt).toLocaleDateString()}
                </p>
              )}

              <div className="flex gap-2">
                {tracker.connected ? (
                  <>
                    <button
                      onClick={() => handleSync(tracker.type)}
                      disabled={syncing === tracker.type}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50"
                      style={{ ...BC, background: color.bg, color: color.inkDim, border: `1px solid ${color.border}` }}>
                      <RefreshCw className={`h-3.5 w-3.5 ${syncing === tracker.type ? 'animate-spin' : ''}`} /> {syncing === tracker.type ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(tracker.type)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold"
                      style={{ ...BC, background: 'rgba(255,77,62,0.12)', color: color.danger, border: `1px solid ${color.danger}22` }}>
                      <X className="h-3.5 w-3.5" /> Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(tracker.type)}
                    disabled={tracker.available === false}
                    className="w-full rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40"
                    style={{ ...BC, background: color.accent, color: color.bg }}>
                    {tracker.available === false ? 'Coming Soon' : 'Connect'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(45,212,160,0.08)',
          border: `1px solid ${color.emerald}22`,
        }}>
        <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted }}>
          <strong style={{ color: color.emerald }}>Auto-sync:</strong> Connected trackers are checked every 6 hours for new matches. You can manually trigger a sync anytime.
        </p>
      </div>
    </div>
  )
}
