/* ═══ Match Details — a cinematic single-match experience ════════════════
   Overview, stats, AI summary, DNA impact, reflection, coach notes, and a
   shortcut into Match Replay Studio. Not a bare data page — a moment. */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Sparkles, TrendingUp, TrendingDown, Film, Edit3, Trash2, Share2, MessageSquare } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { formatDate, getResultBadge } from '@/lib/utils'
import { ModalShell, ModalHeader, ModalFooter, PrimaryButton } from './JournalPrimitives'
import { generateMatchSummary } from '@/lib/matchIntel'
import { ShareCard } from './ShareCard'
import type { Match } from '@/types'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

export function MatchDetails({ match, priorMatches, onClose, onEdit, onDelete, onToggleFavorite }: {
  match: Match; priorMatches: Match[]
  onClose: () => void; onEdit: () => void; onDelete: () => void; onToggleFavorite: () => void
}) {
  const navigate = useNavigate()
  const [showShare, setShowShare] = useState(false)
  const result = getResultBadge(match.result)
  const summary = useMemo(() => generateMatchSummary(match, priorMatches), [match, priorMatches])

  if (showShare) return <ShareCard match={match} onClose={() => setShowShare(false)} />

  return (
    <ModalShell onClose={onClose} maxWidth="46rem">
      {/* cinematic header — graded, not a plain title bar */}
      <div className="relative overflow-hidden rounded-t-2xl px-6 py-8"
        style={{ background: 'linear-gradient(150deg, rgba(23,28,56,0.95), rgba(10,13,28,0.98))' }}>
        <div aria-hidden className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full blur-3xl" style={{ background: 'rgba(255,90,60,0.08)' }} />
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 transition-colors hover:text-white" style={{ color: color.inkMuted }}>✕</button>
        <p style={{ ...BC, fontSize: '0.62rem', letterSpacing: '0.16em', color: color.inkMuted }} className="uppercase">{formatDate(match.date)} · {match.competition}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-base font-black ${result.className}`}>{result.label}</span>
          <h2 style={{ ...BC, fontSize: '1.6rem', fontWeight: 800, color: color.ink }}>vs {match.opponent}</h2>
          <button onClick={onToggleFavorite} aria-label={match.favorite ? 'Unfavorite' : 'Favorite'}>
            <Star className="h-5 w-5" style={match.favorite ? { color: '#ffba08', fill: '#ffba08' } : { color: color.inkMuted }} />
          </button>
        </div>
        <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }} className="mt-1">
          {match.position} · {match.minutesPlayed}' · {match.venue}
          {match.teamScore !== undefined && ` · ${match.teamScore}–${match.opponentScore}`}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* key stats */}
        <div className="grid grid-cols-4 gap-3">
          {[['Goals', match.goals], ['Assists', match.assists], ['Pass Acc', `${match.passAccuracy}%`], ['Rating', match.rating.toFixed(1)]].map(([l, v]) => (
            <div key={l as string} className="rounded-lg p-3 text-center" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
              <p style={{ ...BC, fontSize: '1.3rem', fontWeight: 800, color: color.ink }}>{v}</p>
              <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>{l}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Shots', `${match.shotsOnTarget}/${match.shots}`], ['Distance', `${match.distanceCovered}km`], ['Sprint', `${match.sprintSpeed}km/h`]].map(([l, v]) => (
            <div key={l as string}>
              <p style={{ ...MONO, fontSize: '0.9rem', color: color.inkDim }}>{v}</p>
              <p style={{ ...B, fontSize: '0.62rem', color: color.inkMuted }}>{l}</p>
            </div>
          ))}
        </div>

        {/* AI summary */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(77,159,255,0.05)', border: '1px solid rgba(77,159,255,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" style={{ color: color.ai }} />
            <p style={{ ...BC, fontSize: '0.68rem', letterSpacing: '0.12em', color: color.ai, fontWeight: 700 }}>AI MATCH SUMMARY</p>
          </div>
          <div className="space-y-2">
            {summary.wentWell.map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: color.emerald }} />
                <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.5 }}>{line}</p>
              </div>
            ))}
            {summary.declined.map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <TrendingDown className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: color.warn }} />
                <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, lineHeight: 1.5 }}>{line}</p>
              </div>
            ))}
          </div>
          <p style={{ ...B, fontSize: '0.78rem', color: color.accentSoft, fontWeight: 600, borderTop: 'rgba(77,159,255,0.15) solid 1px', marginTop: 12, paddingTop: 12 }}>
            {summary.improve}
          </p>
        </div>

        {/* reflection, if captured */}
        {match.reflection && (
          <div className="rounded-xl p-4" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" style={{ color: color.inkMuted }} />
              <p style={{ ...BC, fontSize: '0.68rem', letterSpacing: '0.12em', color: color.inkMuted, fontWeight: 700 }}>YOUR REFLECTION</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-2">
              {([['confidence', 'Confidence'], ['energy', 'Energy'], ['focus', 'Focus'], ['enjoyment', 'Enjoyment'], ['fatigue', 'Fatigue'], ['mentalSharpness', 'Sharpness']] as const)
                .filter(([k]) => match.reflection?.[k] !== undefined)
                .map(([k, l]) => (
                  <div key={k}>
                    <p style={{ ...BC, fontSize: '1.1rem', fontWeight: 700, color: color.accent }}>{match.reflection![k]}<span style={{ fontSize: '0.6rem', color: color.inkMuted }}>/10</span></p>
                    <p style={{ ...B, fontSize: '0.62rem', color: color.inkMuted }}>{l}</p>
                  </div>
                ))}
            </div>
            {match.reflection.takeaway && (
              <p style={{ ...B, fontSize: '0.8rem', color: color.inkDim, fontStyle: 'italic' }} className="mt-2">"{match.reflection.takeaway}"</p>
            )}
          </div>
        )}

        {/* coach notes — media-ready slot, renders only if present */}
        {match.media?.coachAnnotations && match.media.coachAnnotations.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
            <p style={{ ...BC, fontSize: '0.68rem', letterSpacing: '0.12em', color: color.inkMuted, fontWeight: 700 }} className="mb-2">COACH NOTES</p>
            {match.media.coachAnnotations.map((a, i) => (
              <p key={i} style={{ ...B, fontSize: '0.8rem', color: color.inkDim }}>
                <strong style={{ color: color.ink }}>{a.author}:</strong> {a.note}
              </p>
            ))}
          </div>
        )}

        {match.notes && (
          <p style={{ ...B, fontSize: '0.8rem', color: color.inkMuted, fontStyle: 'italic' }}>"{match.notes}"</p>
        )}

        <motion.button whileHover={{ x: 2 }} onClick={() => { onClose(); navigate('/analytics') }}
          className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ ...BC, color: color.accentSoft }}>
          <Film className="h-4 w-4" /> Watch AI Replay in Performance Intel →
        </motion.button>
      </div>

      <ModalFooter>
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ ...B, color: color.inkMuted }}>
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={onDelete} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ ...B, color: color.danger }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
        <PrimaryButton onClick={() => setShowShare(true)}><Share2 className="h-3.5 w-3.5" /> Share</PrimaryButton>
      </ModalFooter>
    </ModalShell>
  )
}
