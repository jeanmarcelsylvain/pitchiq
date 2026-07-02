/* ═══ Match Card — premium timeline card for Match History ══════════════════
   Glass surface, hover lift, a performance score, and a one-line takeaway —
   never a table row. */
import { motion } from 'framer-motion'
import { Star, Tag as TagIcon } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { formatDate, getResultBadge, getPositionColor } from '@/lib/utils'
import type { Match } from '@/types'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

function performanceScore(m: Match) {
  return Math.round(Math.min(100, Math.max(0, m.rating * 7 + Math.min(m.passAccuracy, 100) * 0.18 + Math.min(m.goals, 3) * 4 + Math.min(m.assists, 3) * 3)))
}

function takeaway(m: Match): string {
  if (m.goals >= 2) return `${m.goals}-goal performance — well above a typical match.`
  if (m.rating >= 8.5) return 'One of your standout performances this season.'
  if (m.passAccuracy >= 88) return `${m.passAccuracy}% pass accuracy — elite-tier distribution.`
  if (m.rating < 6.5) return 'A tougher outing — worth a look in Match Details.'
  return 'A steady, representative performance.'
}

export function MatchCard({ match, index, onOpen, onToggleFavorite, selectable, selected, onSelectToggle }: {
  match: Match; index: number; onOpen: () => void
  onToggleFavorite: () => void
  selectable?: boolean; selected?: boolean; onSelectToggle?: () => void
}) {
  const result = getResultBadge(match.result)
  const score = performanceScore(match)
  const ratingColor = match.rating >= 7.5 ? color.emerald : match.rating >= 6.5 ? color.warn : color.danger

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.4), ease }}
      whileHover={{ y: -3 }}
      onClick={selectable ? onSelectToggle : onOpen}
      className="glass relative cursor-pointer overflow-hidden rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-float"
      style={{ borderColor: selected ? color.accent : undefined }}
    >
      {selectable && (
        <div aria-hidden className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2"
          style={{ borderColor: selected ? color.accent : color.border, background: selected ? color.accent : 'transparent' }} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 text-base font-black ${result.className}`}>
          {result.label}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 style={{ ...BC, fontSize: '0.95rem', fontWeight: 700, color: color.ink }}>vs {match.opponent}</h3>
            {match.teamScore !== undefined && (
              <span style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }}>{match.teamScore}–{match.opponentScore}</span>
            )}
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPositionColor(match.position)}`}>{match.position}</span>
            {match.favorite && <Star className="h-3.5 w-3.5" style={{ color: '#ffba08', fill: '#ffba08' }} />}
            {match.tags?.slice(0, 2).map(t => (
              <span key={t} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'rgba(77,159,255,0.1)', color: color.ai }}>
                <TagIcon className="h-2.5 w-2.5" /> {t}
              </span>
            ))}
          </div>
          <p style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }} className="mt-0.5">{formatDate(match.date)} · {match.competition}</p>
          <p style={{ ...B, fontSize: '0.75rem', color: color.inkDim, fontStyle: 'italic' }} className="mt-1.5">{takeaway(match)}</p>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:gap-5 text-center flex-shrink-0">
          {[['G', match.goals, color.accent], ['A', match.assists, color.ai], ['P%', `${match.passAccuracy}`, '#a855f7'], ['★', match.rating.toFixed(1), ratingColor]].map(([label, val, c], i) => (
            <div key={i}>
              <p style={{ ...BC, fontSize: '1rem', fontWeight: 800, color: c as string ?? color.ink }}>{val}</p>
              <p style={{ ...B, fontSize: '0.58rem', color: color.inkMuted }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="hidden md:flex flex-col items-center gap-0.5 shrink-0 pl-4" style={{ borderLeft: `1px solid ${color.border}` }}>
          <p style={{ ...BC, fontSize: '1.15rem', fontWeight: 800, color: color.accentSoft }}>{score}</p>
          <p style={{ ...B, fontSize: '0.58rem', color: color.inkMuted }}>Score</p>
        </div>

        {!selectable && (
          <button onClick={e => { e.stopPropagation(); onToggleFavorite() }} aria-label={match.favorite ? 'Remove from favorites' : 'Add to favorites'}
            className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/5">
            <Star className="h-4 w-4" style={match.favorite ? { color: '#ffba08', fill: '#ffba08' } : { color: color.inkMuted }} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
