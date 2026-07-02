/* ═══ Position Intelligence — interactive pitch ══════════════════════════════
   Every position the player has actually logged appears as a node on the
   pitch, sized by sample and colored by rating. Clicking one filters the
   stat panel — no invented positions, no invented coordinates beyond a
   standard formation layout. */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { color, font, ease } from '@/design/tokens'
import type { Match, Position } from '@/types'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

/* standard-formation coordinates, percentage of pitch (x: 0=left touchline,
   y: 0=own goal line, 100=opponent goal line) */
const COORDS: Record<Position, [number, number]> = {
  GK: [50, 5], CB: [50, 20], LB: [15, 24], RB: [85, 24],
  CDM: [50, 42], CM: [50, 52], CAM: [50, 66],
  LM: [15, 52], RM: [85, 52], LW: [15, 78], RW: [85, 78],
  CF: [50, 84], ST: [50, 90],
}

const avg = (ns: number[]) => (ns.length ? ns.reduce((s, n) => s + n, 0) / ns.length : 0)

export function PositionPitch({ matches }: { matches: Match[] }) {
  const stats = useMemo(() => {
    const byPos = new Map<Position, Match[]>()
    matches.forEach(m => byPos.set(m.position, [...(byPos.get(m.position) ?? []), m]))
    return [...byPos.entries()].map(([pos, ms]) => ({
      pos,
      count: ms.length,
      rating: avg(ms.map(m => m.rating)),
      passAcc: avg(ms.map(m => m.passAccuracy)),
      distance: avg(ms.map(m => m.distanceCovered)),
      goals: ms.reduce((s, m) => s + m.goals, 0),
      assists: ms.reduce((s, m) => s + m.assists, 0),
    })).sort((a, b) => b.count - a.count)
  }, [matches])

  const [selected, setSelected] = useState<Position | null>(stats[0]?.pos ?? null)
  const activeStat = stats.find(s => s.pos === selected) ?? stats[0]
  const maxCount = Math.max(...stats.map(s => s.count), 1)

  if (!activeStat) return null

  const ratingColor = (r: number) => (r >= 7.5 ? color.emerald : r >= 6.5 ? color.warn : color.danger)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] items-center">
      {/* pitch */}
      <div className="relative mx-auto w-full max-w-[300px] rounded-lg overflow-hidden"
        style={{ aspectRatio: '68/100', background: 'linear-gradient(180deg, #0f1830, #0a0d1c)', border: `1px solid ${color.border}` }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect x="2" y="2" width="96" height="96" fill="none" stroke={color.border} strokeWidth="0.5" />
          <line x1="2" y1="50" x2="98" y2="50" stroke={color.border} strokeWidth="0.5" />
          <circle cx="50" cy="50" r="9" fill="none" stroke={color.border} strokeWidth="0.5" />
          <rect x="22" y="2" width="56" height="16" fill="none" stroke={color.border} strokeWidth="0.5" />
          <rect x="22" y="82" width="56" height="16" fill="none" stroke={color.border} strokeWidth="0.5" />
        </svg>

        {stats.map(s => {
          const [x, y] = COORDS[s.pos]
          const size = 22 + (s.count / maxCount) * 20
          const isActive = s.pos === selected
          return (
            <button key={s.pos}
              onClick={() => setSelected(s.pos)}
              aria-pressed={isActive}
              aria-label={`${s.pos}: ${s.count} matches, ${s.rating.toFixed(1)} average rating`}
              className="absolute flex items-center justify-center rounded-full transition-transform focus-visible:scale-110"
              style={{
                left: `${x}%`, top: `${100 - y}%`, transform: 'translate(-50%,-50%)',
                width: size, height: size,
                background: isActive ? ratingColor(s.rating) : `${ratingColor(s.rating)}30`,
                border: `2px solid ${ratingColor(s.rating)}`,
                boxShadow: isActive ? `0 0 16px ${ratingColor(s.rating)}80` : 'none',
              }}>
              <span style={{ ...BC, fontSize: size > 34 ? '0.62rem' : '0.5rem', fontWeight: 800, color: isActive ? color.bg : color.ink }}>
                {s.pos}
              </span>
            </button>
          )
        })}
      </div>

      {/* stat panel */}
      <motion.div key={activeStat.pos}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
        className="rounded-xl border p-5" style={{ borderColor: color.border, background: color.surface }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p style={{ ...BC, fontSize: '1.5rem', fontWeight: 800, color: color.ink }}>{activeStat.pos}</p>
            <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted }}>{activeStat.count} match{activeStat.count === 1 ? '' : 'es'} logged here</p>
          </div>
          <div className="text-right">
            <p style={{ ...BC, fontSize: '1.75rem', fontWeight: 800, color: ratingColor(activeStat.rating), fontVariantNumeric: 'tabular-nums' }}>
              {activeStat.rating.toFixed(1)}
            </p>
            <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>avg rating</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Pass Accuracy', `${activeStat.passAcc.toFixed(0)}%`],
            ['Distance / Match', `${activeStat.distance.toFixed(1)} km`],
            ['Goals', `${activeStat.goals}`],
            ['Assists', `${activeStat.assists}`],
          ].map(([label, value]) => (
            <div key={label}>
              <p style={{ ...MONO, fontSize: '1.1rem', color: color.ink }}>{value}</p>
              <p style={{ ...B, fontSize: '0.68rem', color: color.inkMuted }}>{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
