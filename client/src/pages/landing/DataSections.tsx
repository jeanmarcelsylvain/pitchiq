/* ═══ ACT II — discovery. Data. Learning. ═══════════════════════════════════
   The product assembles itself in front of the visitor: dashboard flies
   together, a season unfolds on a timeline, the pitch lights up with
   movement data, stats float in glass. */
import { useRef, type ReactNode } from 'react'
import {
  motion, useScroll, useTransform, useInView, useReducedMotion,
  useMotionValue, useSpring, type MotionValue,
} from 'framer-motion'
import { color, font, ease } from '@/design/tokens'
import { Reveal, MaskedLines, Counter } from '@/design/motion'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

const label = { ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const
const h2 = { ...BC, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.92, color: color.ink } as const

/* ── 02 · DASHBOARD ASSEMBLY ─────────────────────────────────────────────── */

function TiltGroup({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 80, damping: 20 })
  const sry = useSpring(ry, { stiffness: 80, damping: 20 })
  const reduced = useReducedMotion()
  if (reduced) return <div>{children}</div>
  return (
    <motion.div
      ref={ref}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1200 }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 5)
        rx.set(((e.clientY - r.top) / r.height - 0.5) * -5)
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0) }}
    >
      {children}
    </motion.div>
  )
}

function FlyIn({ children, i = 0, from = 40 }: { children: ReactNode; i?: number; from?: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: from, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay: 0.1 + i * 0.09, ease }}
    >
      {children}
    </motion.div>
  )
}

function MiniChart() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const path = 'M0,64 L36,52 L72,58 L108,40 L144,36 L180,24 L216,20 L252,10'
  return (
    <svg ref={ref} viewBox="0 0 252 80" className="w-full" aria-hidden>
      {[20, 40, 60].map(y => <line key={y} x1="0" y1={y} x2="252" y2={y} stroke={color.border} strokeWidth="0.75" />)}
      <motion.path d={path} fill="none" stroke={color.accent} strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : undefined}
        transition={{ duration: 1.4, delay: 0.4, ease }} />
    </svg>
  )
}

export function DashboardAssembly() {
  return (
    <section className="px-6 lg:px-10 py-28 overflow-hidden" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div className="max-w-6xl mx-auto">
        <Reveal><p className="uppercase mb-5" style={label}>02 / Match Analytics</p></Reveal>
        <div className="grid lg:grid-cols-2 gap-6 items-end mb-16">
          <MaskedLines as="h2" style={{ ...h2, fontSize: 'clamp(2.25rem,4.5vw,3.75rem)' }}
            lines={['YOUR SEASON,', 'ASSEMBLED IN FRONT OF YOU.']} />
          <Reveal delay={0.15}>
            <p style={{ ...B, fontSize: '1rem', lineHeight: 1.7, color: color.inkDim }} className="lg:max-w-sm lg:ml-auto">
              Every match feeds the dashboard. Fourteen metrics, charted automatically — no spreadsheets, no guesswork.
            </p>
          </Reveal>
        </div>

        <TiltGroup>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ transformStyle: 'preserve-3d' }}>
            {[
              { l: 'SEASON GOALS', v: 14, s: '', d: '+12.5%' },
              { l: 'AVG RATING', v: 7.8, s: '', d: '+0.6', dec: 1 },
              { l: 'PASS ACCURACY', v: 86, s: '%', d: '+4%' },
              { l: 'SPRINT SPEED', v: 31.2, s: '', d: 'km/h', dec: 1 },
            ].map(({ l, v, s, d, dec }, i) => (
              <FlyIn key={l} i={i}>
                <div className="rounded-lg p-5 h-full" style={{ background: color.bg, border: `1px solid ${color.border}`, boxShadow: 'inset 0 1px 0 rgba(226,224,240,0.04)' }}>
                  <div className="h-[2px] w-8 mb-4" style={{ background: color.accent }} />
                  <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.16em', color: color.inkMuted }}>{l}</p>
                  <p className="mt-2" style={{ ...BC, fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: color.ink, fontVariantNumeric: 'tabular-nums' }}>
                    <Counter to={v} suffix={s} decimals={dec ?? 0} />
                  </p>
                  <p className="mt-1" style={{ ...MONO, fontSize: '0.65rem', color: color.emerald }}>{d}</p>
                </div>
              </FlyIn>
            ))}
            <FlyIn i={4} from={56}>
              <div className="rounded-lg p-5 col-span-2 lg:col-span-3" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.16em', color: color.inkMuted }}>RATING TREND</p>
                  <span style={{ ...MONO, fontSize: '0.65rem', color: color.accent }}>↑ 18% this season</span>
                </div>
                <MiniChart />
              </div>
            </FlyIn>
            <FlyIn i={5} from={56}>
              <div className="rounded-lg p-5 h-full flex flex-col justify-between col-span-2 lg:col-span-1" style={{ background: `linear-gradient(160deg, rgba(255,90,60,0.12), ${color.bg} 60%)`, border: `1px solid rgba(255,90,60,0.3)` }}>
                <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.16em', color: color.accentSoft }}>FORM</p>
                <div>
                  <p style={{ ...BC, fontSize: '2rem', fontWeight: 800, color: color.ink, lineHeight: 1 }}>RISING</p>
                  <p className="mt-1" style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }}>4 of last 5 above season average</p>
                </div>
              </div>
            </FlyIn>
          </div>
        </TiltGroup>
      </div>
    </section>
  )
}

/* ── 03 · SEASON TIMELINE ────────────────────────────────────────────────── */

const MATCHES = [
  { d: 'AUG 24', o: 'NORTHSIDE UNITED', r: 'W 3–1', g: 2, m: 80, rt: 8.2, note: 'Two goals off the left wing.' },
  { d: 'SEP 07', o: 'ATLAS FC',         r: 'D 1–1', g: 0, m: 90, rt: 6.8, note: 'Heavy legs. Third match in 8 days.' },
  { d: 'OCT 12', o: 'RIVER CITY SC',    r: 'W 2–0', g: 1, m: 85, rt: 7.9, note: 'Pass accuracy jumped to 89%.' },
  { d: 'NOV 02', o: 'EASTVIEW ACADEMY', r: 'L 0–2', g: 0, m: 90, rt: 6.1, note: 'Struggled at LW. Data confirmed it.' },
  { d: 'FEB 21', o: 'HARBOR ATHLETIC',  r: 'W 4–2', g: 2, m: 90, rt: 8.8, note: 'Moved to CM. Season-best rating.' },
  { d: 'APR 04', o: 'SUMMIT SC',        r: 'W 2–1', g: 1, m: 88, rt: 8.4, note: 'Five straight above-average games.' },
]

export function SeasonTimeline() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.6'] })
  const line = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  return (
    <section className="px-6 lg:px-10 py-28 relative overflow-hidden" style={{ borderBottom: `1px solid ${color.border}` }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 35% at 85% 15%, rgba(56,64,110,0.22), transparent 70%)' }} />
      <div className="max-w-4xl mx-auto relative">
        <Reveal><p className="uppercase mb-5" style={label}>03 / One Season, Documented</p></Reveal>
        <MaskedLines as="h2" style={{ ...h2, fontSize: 'clamp(2.25rem,4.5vw,3.75rem)', marginBottom: '5rem' }}
          lines={['WATCH A SEASON', 'TELL ITS OWN STORY.']} />

        <div ref={ref} className="relative pl-8 sm:pl-12">
          {/* spine — draws with scroll */}
          <div aria-hidden className="absolute left-[5px] sm:left-[9px] top-0 bottom-0 w-px" style={{ background: color.border }} />
          <motion.div aria-hidden className="absolute left-[5px] sm:left-[9px] top-0 bottom-0 w-px origin-top"
            style={{ background: color.accent, scaleY: line }} />

          <div className="space-y-14">
            {MATCHES.map((m, i) => (
              <Reveal key={m.d} delay={0.05} y={28}>
                <div className="relative">
                  <span aria-hidden className="absolute -left-8 sm:-left-12 top-1.5 h-[11px] w-[11px] rounded-full"
                    style={{ background: m.rt >= 7.5 ? color.accent : color.border, border: `2px solid ${color.bg}` }} />
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span style={{ ...MONO, fontSize: '0.7rem', color: color.inkMuted }}>{m.d}</span>
                    <span style={{ ...BC, fontSize: '1.35rem', fontWeight: 700, color: color.ink, letterSpacing: '0.02em' }}>{m.o}</span>
                    <span style={{ ...BC, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: m.r.startsWith('W') ? color.emerald : m.r.startsWith('L') ? color.danger : color.inkMuted }}>{m.r}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1">
                    <span style={{ ...MONO, fontSize: '0.7rem', color: color.inkDim }}>{m.g}G · {m.m}′ · <span style={{ color: m.rt >= 7.5 ? color.accent : color.inkDim }}>{m.rt.toFixed(1)} rating</span></span>
                    <span style={{ ...B, fontSize: '0.8rem', color: color.inkMuted }}>{m.note}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1}>
          <p className="mt-16 max-w-md" style={{ ...B, fontSize: '1rem', lineHeight: 1.7, color: color.inkDim }}>
            November's slump wasn't a mystery — it was a position problem, visible in the numbers. That's the difference between remembering a season and understanding one.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ── 04 · PITCH INTELLIGENCE (heat map) ──────────────────────────────────── */

export function PitchIntelligence() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })
  const reduced = useReducedMotion()
  const show = inView || !!reduced

  const draw = (delay: number, dur = 1.2) => ({
    initial: reduced ? { opacity: 0 } : { pathLength: 0, opacity: 0 },
    animate: show ? { pathLength: 1, opacity: 1 } : undefined,
    transition: { duration: dur, delay, ease },
  })

  return (
    <section className="px-6 lg:px-10 py-28 overflow-hidden" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.3fr] gap-14 items-center">
        <div>
          <Reveal><p className="uppercase mb-5" style={label}>04 / Pitch Intelligence</p></Reveal>
          <MaskedLines as="h2" style={{ ...h2, fontSize: 'clamp(2rem,4vw,3.25rem)' }}
            lines={['SEE WHERE YOUR', 'GAME ACTUALLY', 'HAPPENS.']} />
          <Reveal delay={0.15}>
            <p className="mt-6" style={{ ...B, fontSize: '0.95rem', lineHeight: 1.7, color: color.inkDim }}>
              Positions, sprint paths, and pressure zones — logged per match and layered into a picture of your movement across the season.
            </p>
            <div className="mt-8 space-y-3">
              {[[color.accent, 'Sprint paths'], ['#7ab8ff', 'Passing lanes'], ['rgba(255,90,60,0.35)', 'Activity zones']].map(([c, t]) => (
                <div key={t as string} className="flex items-center gap-3">
                  <span aria-hidden className="h-2 w-6 rounded-full" style={{ background: c as string }} />
                  <span style={{ ...B, fontSize: '0.8rem', color: color.inkDim }}>{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div ref={ref} className="rounded-lg p-4 sm:p-6" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
            <svg viewBox="0 0 680 440" className="w-full" role="img" aria-label="Animated pitch map showing sprint paths, passing lanes and activity zones">
              <defs>
                <radialGradient id="heatA"><stop offset="0%" stopColor={color.accent} stopOpacity="0.4"/><stop offset="100%" stopColor={color.accent} stopOpacity="0"/></radialGradient>
                <radialGradient id="heatB"><stop offset="0%" stopColor={color.accent} stopOpacity="0.25"/><stop offset="100%" stopColor={color.accent} stopOpacity="0"/></radialGradient>
              </defs>

              {/* pitch lines draw first */}
              <motion.rect x="20" y="20" width="640" height="400" rx="4" fill="none" stroke={color.border} strokeWidth="1.5" {...draw(0, 1)} />
              <motion.line x1="340" y1="20" x2="340" y2="420" stroke={color.border} strokeWidth="1.5" {...draw(0.3, 0.6)} />
              <motion.circle cx="340" cy="220" r="56" fill="none" stroke={color.border} strokeWidth="1.5" {...draw(0.5, 0.8)} />
              <motion.rect x="20" y="130" width="90" height="180" fill="none" stroke={color.border} strokeWidth="1.5" {...draw(0.7, 0.6)} />
              <motion.rect x="570" y="130" width="90" height="180" fill="none" stroke={color.border} strokeWidth="1.5" {...draw(0.7, 0.6)} />

              {/* heat blooms grow */}
              {[[420, 180, 110, 'heatA'], [510, 260, 90, 'heatB'], [300, 150, 75, 'heatB']].map(([x, y, r, g], i) => (
                <motion.circle key={i} cx={x as number} cy={y as number} r={r as number} fill={`url(#${g})`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={show ? { scale: 1, opacity: 1 } : undefined}
                  transition={{ duration: 1.4, delay: 1.2 + i * 0.25, ease }}
                  style={{ transformOrigin: `${x}px ${y}px` }} />
              ))}

              {/* passing lanes */}
              {['M120,220 L300,150 L420,185', 'M300,150 L470,120 L560,200', 'M340,300 L470,260 L555,250'].map((d, i) => (
                <motion.path key={i} d={d} fill="none" stroke="#7ab8ff" strokeWidth="1.5" strokeDasharray="5 7" strokeLinecap="round" opacity="0.65" {...draw(1.8 + i * 0.2, 1)} />
              ))}

              {/* sprint path */}
              <motion.path d="M150,340 C240,330 280,250 350,235 C430,215 470,190 545,165"
                fill="none" stroke={color.accent} strokeWidth="2.5" strokeLinecap="round" {...draw(2.5, 1.6)} />
              <motion.circle cx="545" cy="165" r="5" fill={color.accent}
                initial={{ scale: 0 }} animate={show ? { scale: 1 } : undefined}
                transition={{ duration: 0.4, delay: 4, ease }} style={{ transformOrigin: '545px 165px' }} />

              {/* pressure zone pulse */}
              {!reduced && (
                <motion.circle cx="420" cy="180" r="24" fill="none" stroke={color.accent} strokeWidth="1" opacity="0.5"
                  animate={show ? { r: [24, 44], opacity: [0.5, 0] } : undefined}
                  transition={{ duration: 2.4, delay: 4.2, repeat: Infinity, ease: 'easeOut' }} />
              )}
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── 05 · FLOATING STATS ─────────────────────────────────────────────────── */

function Spark({ points }: { points: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <svg ref={ref} viewBox="0 0 120 36" className="w-full" aria-hidden>
      <motion.path d={points} fill="none" stroke={color.accent} strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : undefined}
        transition={{ duration: 1.2, delay: 0.5, ease }} />
    </svg>
  )
}

export function FloatingStats() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 50, damping: 20 })
  const sy = useSpring(my, { stiffness: 50, damping: 20 })
  const reduced = useReducedMotion()

  const panels = [
    { t: 'GOALS PER GAME', v: 0.9, dec: 1, sub: 'Up from 0.6 last season', spark: 'M0,30 L20,26 L40,28 L60,20 L80,16 L100,10 L120,6', depth: 1 },
    { t: 'PASS ACCURACY', v: 86, s: '%', sub: 'Season average, all positions', spark: 'M0,26 L20,24 L40,20 L60,22 L80,14 L100,12 L120,8', depth: 1.8 },
    { t: 'TOP SPRINT', v: 31.2, dec: 1, s: ' km/h', sub: 'Personal record — Feb 21', spark: 'M0,28 L20,27 L40,22 L60,18 L80,20 L100,12 L120,4', depth: 1.4 },
  ]

  return (
    <section
      onMouseMove={e => {
        if (reduced) return
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 2)
        my.set(((e.clientY - r.top) / r.height - 0.5) * 2)
      }}
      className="px-6 lg:px-10 py-28 relative overflow-hidden" style={{ borderBottom: `1px solid ${color.border}` }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 45% 40% at 50% 110%, rgba(255,90,60,0.07), transparent 70%)' }} />
      <div ref={ref} className="max-w-6xl mx-auto relative">
        <Reveal><p className="uppercase mb-5" style={label}>05 / The Numbers</p></Reveal>
        <MaskedLines as="h2" style={{ ...h2, fontSize: 'clamp(2.25rem,4.5vw,3.75rem)', marginBottom: '4.5rem' }}
          lines={['PROOF, FLOATING', 'IN GLASS.']} />

        <div className="grid sm:grid-cols-3 gap-5" style={{ perspective: 1200 }}>
          {panels.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.1}>
              <StatPanel {...p} mx={sx} my={sy} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatPanel({ t, v, s = '', dec = 0, sub, spark, depth, mx, my }: {
  t: string; v: number; s?: string; dec?: number; sub: string; spark: string; depth: number
  mx: MotionValue<number>; my: MotionValue<number>
}) {
  const reduced = useReducedMotion()
  const x = useTransform(mx, val => val * depth * 8)
  const y = useTransform(my, val => val * depth * 6)
  return (
    <motion.div
      className="glass rounded-lg p-6"
      style={reduced ? undefined : { x, y }}
      whileHover={reduced ? undefined : { y: -6, transition: { duration: 0.3, ease } }}
    >
      <p style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.18em', color: color.inkMuted }}>{t}</p>
      <p className="mt-3" style={{ ...BC, fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: color.ink, fontVariantNumeric: 'tabular-nums' }}>
        <Counter to={v} decimals={dec} suffix={s} />
      </p>
      <p className="mt-1 mb-5" style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }}>{sub}</p>
      <Spark points={spark} />
    </motion.div>
  )
}
