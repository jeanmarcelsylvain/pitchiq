/* ═══ Match Replay Studio ═════════════════════════════════════════════════
   NOT real video. This is a stylized reconstruction generated from the
   match's logged statistics — a way to *feel* a match's shape (touches,
   sprints, pressure, goal moments) rather than relive its exact events.
   The disclaimer is not fine print; it's a first-class part of the UI. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Info, Target, Sparkles } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import type { Match } from '@/types'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

/* seeded PRNG so the same match always reconstructs the same way */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashSeed(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

interface Beat {
  t: number            // 0-1 through the match
  x: number; y: number // 0-100 pitch coords
  kind: 'touch' | 'sprint' | 'goal' | 'assist'
  path?: [number, number][]
}

function buildBeats(m: Match): Beat[] {
  const rand = mulberry32(hashSeed(m.id + m.date))
  const beats: Beat[] = []
  const touchCount = Math.max(20, Math.round((m.passAccuracy / 100) * 55 + rand() * 15))
  const baseY = m.position === 'GK' ? 8 : m.position.startsWith('C') && m.position !== 'CF' ? 45 : 60

  for (let i = 0; i < touchCount; i++) {
    beats.push({
      t: (i + rand() * 0.6) / touchCount,
      x: 20 + rand() * 60,
      y: Math.min(94, Math.max(6, baseY + (rand() - 0.5) * 55)),
      kind: 'touch',
    })
  }
  const sprintCount = Math.max(2, Math.round((m.sprintSpeed / 33) * 6))
  for (let i = 0; i < sprintCount; i++) {
    const startT = rand()
    const sx = 15 + rand() * 30, sy = 20 + rand() * 60
    const ex = sx + 25 + rand() * 30, ey = sy + (rand() - 0.5) * 30
    beats.push({ t: startT, x: ex, y: Math.min(94, Math.max(6, ey)), kind: 'sprint', path: [[sx, sy], [Math.min(96, ex), Math.min(94, Math.max(6, ey))]] })
  }
  for (let i = 0; i < m.goals; i++) {
    beats.push({ t: 0.15 + rand() * 0.75, x: 85 + rand() * 10, y: 40 + rand() * 20, kind: 'goal' })
  }
  for (let i = 0; i < m.assists; i++) {
    beats.push({ t: 0.15 + rand() * 0.75, x: 70 + rand() * 15, y: 30 + rand() * 40, kind: 'assist' })
  }
  return beats.sort((a, b) => a.t - b.t)
}

const SPEEDS = [1, 2, 4]

export function MatchReplayStudio({ match }: { match: Match }) {
  const reduced = useReducedMotion()
  const beats = useMemo(() => buildBeats(match), [match])
  const [progress, setProgress] = useState(0) // 0-1
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const raf = useRef<number>()
  const last = useRef<number>()

  useEffect(() => {
    if (!playing) return
    const DURATION_MS = 18000 / speed
    const tick = (now: number) => {
      if (last.current === undefined) last.current = now
      const dt = now - last.current
      last.current = now
      setProgress(p => {
        const next = p + dt / DURATION_MS
        if (next >= 1) { setPlaying(false); return 1 }
        return next
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current); last.current = undefined }
  }, [playing, speed])

  const visibleTouches = beats.filter(b => b.kind === 'touch' && b.t <= progress)
  const visibleSprints = beats.filter(b => b.kind === 'sprint' && b.t <= progress)
  const events = beats.filter(b => (b.kind === 'goal' || b.kind === 'assist'))
  const minute = Math.round(progress * match.minutesPlayed)

  return (
    <div>
      {/* disclaimer — first-class, not fine print */}
      <div className="flex items-start gap-2.5 rounded-lg p-3 mb-4" style={{ background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.18)' }}>
        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: color.ai }} aria-hidden />
        <p style={{ ...B, fontSize: '0.76rem', lineHeight: 1.5, color: color.inkDim }}>
          <strong style={{ color: color.ai }}>AI-generated reconstruction</strong> — not real footage. This is built entirely from your logged stats (touches, sprint speed, goals, assists) to illustrate the shape of this match, not to reproduce exact events.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* pitch */}
        <div>
          <div className="relative mx-auto max-w-[420px] rounded-lg overflow-hidden"
            style={{ aspectRatio: '100/64', background: 'linear-gradient(160deg, #0f1830, #0a0d1c)', border: `1px solid ${color.border}` }}>
            <svg viewBox="0 0 100 64" className="absolute inset-0 h-full w-full" aria-hidden>
              <rect x="1" y="1" width="98" height="62" fill="none" stroke={color.border} strokeWidth="0.4" />
              <line x1="50" y1="1" x2="50" y2="63" stroke={color.border} strokeWidth="0.4" />
              <circle cx="50" cy="32" r="7" fill="none" stroke={color.border} strokeWidth="0.4" />
              <rect x="1" y="18" width="12" height="28" fill="none" stroke={color.border} strokeWidth="0.4" />
              <rect x="87" y="18" width="12" height="28" fill="none" stroke={color.border} strokeWidth="0.4" />

              {/* touch heat */}
              {visibleTouches.map((b, i) => (
                <motion.circle key={`t${i}`} cx={b.x * 0.98 + 1} cy={b.y * 0.62 + 1} r="1.4" fill={color.accent}
                  initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ duration: 0.3 }} />
              ))}
              {/* sprint paths */}
              {visibleSprints.map((b, i) => b.path && (
                <motion.line key={`s${i}`} x1={b.path[0][0] * 0.98 + 1} y1={b.path[0][1] * 0.62 + 1}
                  x2={b.path[1][0] * 0.98 + 1} y2={b.path[1][1] * 0.62 + 1}
                  stroke={color.emerald} strokeWidth="0.6" strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.75 }}
                  transition={{ duration: 0.6, ease }} />
              ))}
              {/* goal/assist markers */}
              {events.filter(e => e.t <= progress).map((e, i) => (
                <motion.g key={`e${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
                  <circle cx={e.x * 0.98 + 1} cy={e.y * 0.62 + 1} r="2.4" fill={e.kind === 'goal' ? color.accent : color.ai} />
                  <circle cx={e.x * 0.98 + 1} cy={e.y * 0.62 + 1} r="4" fill="none" stroke={e.kind === 'goal' ? color.accent : color.ai} strokeWidth="0.4" opacity="0.5" />
                </motion.g>
              ))}
              {/* live position marker */}
              {progress > 0 && progress < 1 && (() => {
                const last = visibleTouches[visibleTouches.length - 1]
                return <circle cx={(last?.x ?? 50) * 0.98 + 1} cy={(last?.y ?? 32) * 0.62 + 1} r="1.8" fill={color.ink} />
              })()}
            </svg>
          </div>

          {/* transport controls */}
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => setPlaying(p => !p)}
              aria-label={playing ? 'Pause replay' : 'Play replay'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
              style={{ background: color.accent, color: color.bg }}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <input type="range" min={0} max={1000} value={Math.round(progress * 1000)}
              onChange={e => { setProgress(Number(e.target.value) / 1000); setPlaying(false) }}
              aria-label="Scrub replay timeline"
              className="flex-1 accent-orange-500" style={{ accentColor: color.accent }} />
            <span style={{ ...MONO, fontSize: '0.7rem', color: color.inkMuted, width: 42 }} className="text-right shrink-0">{minute}'</span>
            <div className="flex items-center gap-1 shrink-0">
              {SPEEDS.map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors"
                  style={{ background: speed === s ? color.accent : 'transparent', color: speed === s ? color.bg : color.inkMuted }}>
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* legend + event log */}
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            {[[color.accent, 'Touches'], [color.emerald, 'Sprints'], [color.accent, 'Goal'], [color.ai, 'Assist']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: c as string }} />
                <span style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }}>{l}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: color.border, background: color.bg }}>
            <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.14em', color: color.inkMuted, fontWeight: 700 }} className="mb-3">MATCH EVENTS</p>
            {events.length === 0 ? (
              <p style={{ ...B, fontSize: '0.78rem', color: color.inkMuted }}>No goals or assists logged for this match.</p>
            ) : (
              <div className="space-y-2">
                {events.map((e, i) => {
                  const reached = e.t <= progress
                  return (
                    <AnimatePresence key={i}>
                      <motion.div className="flex items-center gap-2.5"
                        animate={{ opacity: reached ? 1 : 0.35 }} transition={{ duration: 0.3 }}>
                        {e.kind === 'goal' ? <Target className="h-3.5 w-3.5" style={{ color: color.accent }} /> : <Sparkles className="h-3.5 w-3.5" style={{ color: color.ai }} />}
                        <span style={{ ...B, fontSize: '0.78rem', color: reached ? color.ink : color.inkMuted }}>
                          {e.kind === 'goal' ? 'Goal' : 'Assist'} — {Math.round(e.t * match.minutesPlayed)}'
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  )
                })}
              </div>
            )}
          </div>

          <p style={{ ...B, fontSize: '0.72rem', color: color.inkMuted, lineHeight: 1.5 }} className="mt-4">
            {reduced ? 'Scrub the timeline above to explore this match — animation is reduced per your system settings.' : 'Press play, or drag the timeline to jump anywhere in the match.'}
          </p>
        </div>
      </div>
    </div>
  )
}
