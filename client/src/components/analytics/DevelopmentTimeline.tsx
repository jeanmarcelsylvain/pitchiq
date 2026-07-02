/* ═══ Development Timeline ════════════════════════════════════════════════
   Every match across every season, on one spine. Hover or focus any node
   for the full match card plus a one-line AI takeaway generated from how
   that match compares to the athlete's rolling average at the time.
   Supports filtering to a single season and left/right keyboard navigation
   so long careers (hundreds of matches) stay usable, not just scrollable. */
import { useState, useMemo, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { color, font, ease } from '@/design/tokens'
import type { Match } from '@/types'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

interface TimelineMatch extends Match { seasonName: string; seasonId?: string }

function takeaway(m: Match, rollingAvg: number): string {
  const delta = m.rating - rollingAvg
  if (m.goals >= 2) return `Multi-goal match — ${m.goals} goals, well above your rolling average.`
  if (delta >= 1) return 'Season-best form window — one of your strongest performances.'
  if (delta <= -1) return 'Well below your rolling average — worth reviewing what changed.'
  if (m.assists >= 2) return 'Playmaking peak — multiple assists in one match.'
  return 'A representative, on-average performance.'
}

const NODE_W = 14

export function DevelopmentTimeline({ matches }: { matches: TimelineMatch[] }) {
  const fullSorted = useMemo(() => [...matches].sort((a, b) => a.date.localeCompare(b.date)), [matches])
  const seasonNames = useMemo(() => [...new Set(fullSorted.map(m => m.seasonName))], [fullSorted])
  const [seasonFilter, setSeasonFilter] = useState<string>('all')

  const sorted = useMemo(
    () => seasonFilter === 'all' ? fullSorted : fullSorted.filter(m => m.seasonName === seasonFilter),
    [fullSorted, seasonFilter]
  )
  const [active, setActive] = useState<number | null>(sorted.length ? sorted.length - 1 : null)
  const ref = useRef(null)
  const spineRef = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const reduced = useReducedMotion()
  const show = inView || !!reduced

  const rollingAvgAt = (i: number) => {
    const window = sorted.slice(Math.max(0, i - 4), i + 1)
    return window.reduce((s, m) => s + m.rating, 0) / window.length
  }

  const moveFocus = (from: number, dir: 1 | -1) => {
    const next = Math.min(sorted.length - 1, Math.max(0, from + dir))
    setActive(next)
    const btn = spineRef.current?.querySelectorAll('button')[next] as HTMLButtonElement | undefined
    btn?.focus()
  }

  if (fullSorted.length === 0) return null
  const activeIndex = active !== null ? Math.min(active, sorted.length - 1) : null
  const activeMatch = activeIndex !== null ? sorted[activeIndex] : null

  const ratingColor = (r: number) => (r >= 7.5 ? color.emerald : r >= 6.5 ? color.warn : color.danger)

  /* season boundaries — first index in `sorted` where a new season begins,
     only meaningful (and rendered) when showing all seasons together */
  const boundaries = seasonFilter === 'all'
    ? sorted.reduce<{ i: number; name: string }[]>((acc, m, i) => {
        if (i === 0 || m.seasonName !== sorted[i - 1].seasonName) acc.push({ i, name: m.seasonName })
        return acc
      }, [])
    : []

  return (
    <div ref={ref}>
      {seasonNames.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => { setSeasonFilter('all'); setActive(sorted.length - 1) }}
            className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
            style={{ ...BC, background: seasonFilter === 'all' ? color.accent : 'transparent', color: seasonFilter === 'all' ? color.bg : color.inkMuted, border: `1px solid ${seasonFilter === 'all' ? color.accent : color.border}` }}>
            All Seasons
          </button>
          {seasonNames.map(name => (
            <button key={name} onClick={() => setSeasonFilter(name)}
              className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
              style={{ ...BC, background: seasonFilter === name ? color.accent : 'transparent', color: seasonFilter === name ? color.bg : color.inkMuted, border: `1px solid ${seasonFilter === name ? color.accent : color.border}` }}>
              {name}
            </button>
          ))}
        </div>
      )}

      {/* spine */}
      <div className="relative overflow-x-auto pb-3" role="group" aria-label="Match timeline — use arrow keys to navigate">
        <div ref={spineRef} className="relative flex items-end gap-1 min-w-max px-1" style={{ height: boundaries.length > 1 ? 108 : 92 }}>
          <div aria-hidden className="absolute left-0 right-0 h-px" style={{ bottom: 24, background: color.border }} />
          {boundaries.length > 1 && boundaries.map(b => (
            <span key={b.name} aria-hidden style={{ position: 'absolute', left: b.i * (NODE_W + 4), bottom: 0, ...MONO, fontSize: '0.55rem', color: color.inkMuted, whiteSpace: 'nowrap' }}>
              {b.name}
            </span>
          ))}
          {sorted.map((m, i) => {
            const isActive = i === activeIndex
            const h = 10 + (m.rating / 10) * 46
            return (
              <button key={m.id}
                onClick={() => setActive(i)}
                onFocus={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                onKeyDown={e => {
                  if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(i, 1) }
                  if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(i, -1) }
                }}
                aria-label={`${m.seasonName}: vs ${m.opponent}, ${m.rating.toFixed(1)} rating`}
                aria-pressed={isActive}
                className="relative flex flex-col items-center justify-end shrink-0 focus-visible:outline-none"
                style={{ width: NODE_W, height: 92 }}>
                <motion.span
                  initial={{ scaleY: 0 }} animate={show ? { scaleY: 1 } : undefined}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.015, 1), ease }}
                  className="block w-1 rounded-full origin-bottom"
                  style={{ height: h, marginBottom: 24, background: isActive ? ratingColor(m.rating) : `${ratingColor(m.rating)}55`,
                    boxShadow: isActive ? `0 0 8px ${ratingColor(m.rating)}90` : 'none' }} />
                <span aria-hidden className="absolute rounded-full transition-transform"
                  style={{ bottom: 21, height: 6, width: 6, background: ratingColor(m.rating), transform: isActive ? 'scale(1.5)' : 'scale(1)' }} />
              </button>
            )
          })}
        </div>
      </div>

      {/* active match card */}
      {activeMatch && (
        <motion.div key={activeMatch.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}
          className="rounded-xl border p-5 mt-2" style={{ borderColor: color.border, background: color.surface }}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p style={{ ...MONO, fontSize: '0.68rem', color: color.inkMuted }}>{activeMatch.seasonName} · {activeMatch.date}</p>
              <p style={{ ...BC, fontSize: '1.2rem', fontWeight: 700, color: color.ink }}>vs {activeMatch.opponent}</p>
              <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted }}>{activeMatch.competition} · {activeMatch.position}</p>
            </div>
            <div className="text-right">
              <p style={{ ...BC, fontSize: '1.75rem', fontWeight: 800, color: ratingColor(activeMatch.rating) }}>{activeMatch.rating.toFixed(1)}</p>
              <p style={{ ...B, fontSize: '0.65rem', color: color.inkMuted }}>rating</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[['Goals', activeMatch.goals], ['Assists', activeMatch.assists], ['Minutes', activeMatch.minutesPlayed], ['Pass %', `${activeMatch.passAccuracy}%`]].map(([l, v]) => (
              <div key={l as string}>
                <p style={{ ...MONO, fontSize: '1rem', color: color.ink }}>{v}</p>
                <p style={{ ...B, fontSize: '0.62rem', color: color.inkMuted }}>{l}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg p-3 flex items-start gap-2.5" style={{ background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.16)' }}>
            <span style={{ ...BC, fontSize: '0.58rem', letterSpacing: '0.12em', color: color.ai, fontWeight: 700 }} className="shrink-0 mt-0.5">AI</span>
            <p style={{ ...B, fontSize: '0.78rem', color: color.inkDim, lineHeight: 1.5 }}>
              {takeaway(activeMatch, rollingAvgAt(sorted.indexOf(activeMatch)))}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
