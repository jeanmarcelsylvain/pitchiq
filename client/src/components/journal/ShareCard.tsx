/* ═══ Share Card ══════════════════════════════════════════════════════════
   A shareable match summary, mobile-optimized. Copies a formatted text
   summary today; the card itself is the visual spec for a future image
   export (html-to-canvas or server-rendered OG image) — same layout,
   same data, no redesign needed when that ships. */
import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { color, font } from '@/design/tokens'
import { ModalShell, ModalHeader, ModalFooter, PrimaryButton } from './JournalPrimitives'
import type { Match } from '@/types'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

function performanceScore(m: Match) {
  return Math.round(Math.min(100, Math.max(0, m.rating * 7 + Math.min(m.passAccuracy, 100) * 0.18 + Math.min(m.goals, 3) * 4 + Math.min(m.assists, 3) * 3)))
}

export function ShareCard({ match, onClose }: { match: Match; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const score = performanceScore(match)

  const summaryText = `${match.opponent} · ${match.date}\n${match.position} · ${match.minutesPlayed}'\n\n` +
    `Rating: ${match.rating.toFixed(1)}  ·  Performance Score: ${score}\n` +
    `${match.goals}G ${match.assists}A · ${match.passAccuracy}% passing · ${match.distanceCovered}km\n\n` +
    `Logged with PitchIQ — building a career, one match at a time.`

  const copy = async () => {
    try { await navigator.clipboard.writeText(summaryText); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { /* clipboard unavailable — no-op, button stays as "Copy" */ }
  }

  return (
    <ModalShell onClose={onClose} maxWidth="26rem">
      <ModalHeader title="Share This Match" onClose={onClose} />
      <div className="p-6">
        <div className="rounded-xl p-6 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(23,28,56,0.95), rgba(10,13,28,0.98))', border: `1px solid ${color.border}` }}>
          <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full blur-3xl" style={{ background: 'rgba(255,90,60,0.1)' }} />
          <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.16em', color: color.inkMuted }} className="uppercase relative">PitchIQ Journal</p>
          <h3 style={{ ...BC, fontSize: '1.4rem', fontWeight: 800, color: color.ink }} className="mt-2 relative">vs {match.opponent}</h3>
          <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted }} className="relative">{match.date} · {match.position}</p>
          <div className="mt-5 flex items-center justify-center gap-8 relative">
            <div>
              <p style={{ ...BC, fontSize: '2rem', fontWeight: 900, color: color.accent }}>{match.rating.toFixed(1)}</p>
              <p style={{ ...B, fontSize: '0.6rem', color: color.inkMuted }}>Rating</p>
            </div>
            <div>
              <p style={{ ...BC, fontSize: '2rem', fontWeight: 900, color: color.ink }}>{score}</p>
              <p style={{ ...B, fontSize: '0.6rem', color: color.inkMuted }}>Score</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 relative">
            {[['Goals', match.goals], ['Assists', match.assists], ['Pass %', `${match.passAccuracy}%`]].map(([l, v]) => (
              <div key={l as string}>
                <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: color.inkDim }}>{v}</p>
                <p style={{ ...B, fontSize: '0.58rem', color: color.inkMuted }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }} className="mt-3 text-center">
          Image export is coming soon — for now, copy a shareable summary.
        </p>
      </div>
      <ModalFooter>
        <div />
        <PrimaryButton onClick={copy}>
          {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy Summary</>}
        </PrimaryButton>
      </ModalFooter>
    </ModalShell>
  )
}
