/* ═══ ACT III — intelligence. The data becomes a coach. ═════════════════════
   06: pinned scroll sequence — loose statistics converge, connect into a
   network, and the AI interface emerges from it.
   07: the training plan writes itself, step by step. */
import { useRef, useState, useEffect } from 'react'
import {
  motion, useScroll, useTransform, useSpring, useInView, useReducedMotion,
  type MotionValue,
} from 'framer-motion'
import { Sparkles, Check } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { Reveal, MaskedLines } from '@/design/motion'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }
const AI   = '#7ab8ff'

const label = { ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const

/* ── 06 · AI REVEAL — pinned convergence sequence ────────────────────────── */

/* scattered stats: [startX%, startY%, label] — converge toward center */
const FRAGMENTS: [number, number, string][] = [
  [8, 12, '2 GOALS'], [85, 8, '87% PASS'], [15, 78, '31.2 KM/H'], [90, 70, '8.4 RATING'],
  [45, 5, '10.4 KM'], [5, 45, '3 ASSISTS'], [92, 40, '84% DUELS'], [25, 90, '0.42 xG'],
  [70, 88, '90 MIN'], [60, 10, '12 SPRINTS'], [10, 28, '6 SHOTS'], [80, 25, '89 TOUCHES'],
  [35, 85, '4 KEY PASSES'], [93, 55, '7.8 AVG'], [20, 8, '14 METRICS'], [50, 92, 'W 3–1'],
]

function Fragment({ p, sx, sy, text }: { p: MotionValue<number>; sx: number; sy: number; text: string }) {
  /* drift toward center — vw/vh units (element-relative % would collapse all
     fragments onto the center point). They converge only 75% of the way and
     dissolve while still spatially distinct, so no unreadable pile-up. */
  const x = useTransform(p, [0, 0.38], [`${(sx - 50) * 0.9}vw`, `${(sx - 50) * 0.22}vw`])
  const y = useTransform(p, [0, 0.38], [`${(sy - 50) * 0.7}vh`, `${(sy - 50) * 0.2}vh`])
  const opacity = useTransform(p, [0, 0.06, 0.28, 0.38], [0, 0.9, 0.6, 0])
  const scale = useTransform(p, [0, 0.38], [1, 0.6])
  return (
    <motion.span aria-hidden className="absolute left-1/2 top-1/2 whitespace-nowrap"
      style={{ ...MONO, x, y, opacity, scale, fontSize: '0.7rem', color: color.inkDim }}>
      {text}
    </motion.span>
  )
}

/* network: nodes on a circle + hub, edges draw in as scroll passes 0.4 */
const NODES = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(a) * 110, Math.sin(a) * 110] as [number, number]
})

export function AIReveal() {
  const outer = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: outer, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.4 })

  /* phases overlap so the screen is never sparse: network forms while
     fragments are still converging, card rises while the network glows */
  const netOpacity = useTransform(p, [0.22, 0.38], [0, 1])
  const netScale = useTransform(p, [0.22, 0.45], [0.85, 1])
  const netFade = useTransform(p, [0.52, 0.66], [1, 0.25])
  const edgeDraw = useTransform(p, [0.26, 0.46], [0, 1])
  const cardIn = useTransform(p, [0.52, 0.68], [0, 1])
  const cardY = useTransform(p, [0.52, 0.68], [48, 0])
  const introFade = useTransform(p, [0, 0.14, 0.3], [1, 1, 0])
  const netVisible = useTransform([netOpacity, netFade] as MotionValue<number>[], ([a, b]: number[]) => a * b)

  if (reduced) {
    /* static fallback: headline + AI card, no pinning */
    return (
      <section className="px-6 lg:px-10 py-28" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="uppercase mb-5" style={label}>06 / AI Coach</p>
          <h2 style={{ ...BC, fontSize: 'clamp(2.25rem,4.5vw,3.75rem)', fontWeight: 800, lineHeight: 0.92, color: color.ink }}>
            EVERY NUMBER YOU LOG BECOMES A COACH.
          </h2>
          <div className="mt-12 text-left"><AICard /></div>
        </div>
      </section>
    )
  }

  return (
    <section ref={outer} className="relative" style={{ height: '180vh', background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center px-6">
        {/* ambient AI light */}
        <motion.div aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ opacity: netOpacity, background: `radial-gradient(ellipse 45% 40% at 50% 50%, rgba(77,159,255,0.12), transparent 70%)` }} />

        {/* intro line */}
        <motion.div className="absolute inset-x-6 top-[14vh] text-center" style={{ opacity: introFade }}>
          <p className="uppercase mb-4" style={label}>06 / AI Coach</p>
          <h2 style={{ ...BC, fontSize: 'clamp(1.75rem,3.5vw,2.75rem)', fontWeight: 800, lineHeight: 1, color: color.ink }}>
            A SEASON OF NUMBERS, SCATTERED —<br />
            <span style={{ color: color.inkMuted }}>UNTIL THEY LEARN TO TALK TO EACH OTHER.</span>
          </h2>
        </motion.div>

        {/* converging fragments */}
        <div className="absolute inset-0" aria-hidden>
          {FRAGMENTS.map(([x, y, t]) => <Fragment key={t} p={p} sx={x} sy={y} text={t} />)}
        </div>

        {/* neural network */}
        <motion.svg aria-hidden viewBox="-160 -160 320 320" className="absolute w-[300px] h-[300px] sm:w-[380px] sm:h-[380px]"
          style={{ opacity: netVisible, scale: netScale }}>
          {NODES.map(([x, y], i) => (
            <motion.line key={`e${i}`} x1="0" y1="0" x2={x} y2={y} stroke={AI} strokeWidth="1" opacity="0.5"
              style={{ pathLength: edgeDraw }} />
          ))}
          {NODES.map(([x1, y1], i) => {
            const [x2, y2] = NODES[(i + 1) % NODES.length]
            return <motion.line key={`r${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={AI} strokeWidth="0.75" opacity="0.3" style={{ pathLength: edgeDraw }} />
          })}
          {NODES.map(([x, y], i) => (
            <motion.circle key={`n${i}`} cx={x} cy={y} r="4" fill={AI} style={{ opacity: netOpacity }} />
          ))}
          <motion.circle cx="0" cy="0" r="9" fill={AI} style={{ opacity: netOpacity }} />
          <motion.circle cx="0" cy="0" r="18" fill="none" stroke={AI} strokeWidth="1" opacity="0.4"
            animate={{ r: [18, 30], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
        </motion.svg>

        {/* the interface emerges */}
        <motion.div className="relative z-10 w-full max-w-md" style={{ opacity: cardIn, y: cardY }}>
          <AICard />
        </motion.div>
      </div>
    </section>
  )
}

function AICard() {
  return (
    <div className="glass rounded-lg p-6" style={{ borderColor: 'rgba(77,159,255,0.3)' }}>
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={14} color={AI} aria-hidden />
        <span style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.18em', color: AI }}>AI COACH</span>
        <span className="ml-auto h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: AI }} aria-hidden />
      </div>
      {[
        ['IMPROVEMENT', 'Pass accuracy drops 12% at LW vs CM. Your data says centre-mid is your position — the film agrees.', color.accent],
        ['TREND', 'Sprint speed up 8.3% across 6 matches. The interval work is landing.', AI],
        ['ACTION', '3 matches in 8 days. Schedule recovery before Saturday or expect a sub-7 rating.', color.warn],
      ].map(([tag, text, c]) => (
        <div key={tag} className="py-3.5" style={{ borderTop: `1px solid ${color.border}` }}>
          <span style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.14em', color: c, fontWeight: 700 }}>{tag}</span>
          <p className="mt-1" style={{ ...B, fontSize: '0.82rem', lineHeight: 1.55, color: color.inkDim }}>{text}</p>
        </div>
      ))}
    </div>
  )
}

/* ── 07 · TRAINING PLAN — the plan writes itself ─────────────────────────── */

const STEPS = ['Weakness detected — left-wing pass accuracy', 'Analysis complete — 14 metrics · 22 matches', 'Generating recommendations…']
const PLAN = [
  { d: 'TUE', f: 'Positional passing', t: '45 min · wall passes, scanning drills' },
  { d: 'THU', f: 'Sprint intervals', t: '30 min · 6×40m, full recovery' },
  { d: 'SAT', f: 'Pre-match activation', t: '20 min · light touches, mobility' },
]

export function TrainingPlanDemo() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-25%' })
  const reduced = useReducedMotion()
  const [step, setStep] = useState(reduced ? STEPS.length + 1 : 0)

  useEffect(() => {
    if (!inView || reduced) return
    if (step > STEPS.length) return
    const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 400 : 900)
    return () => clearTimeout(t)
  }, [inView, step, reduced])

  return (
    <section className="px-6 lg:px-10 py-28 relative overflow-hidden" style={{ borderBottom: `1px solid ${color.border}` }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 15% 80%, rgba(56,64,110,0.2), transparent 70%)' }} />
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center relative">
        <div>
          <Reveal><p className="uppercase mb-5" style={label}>07 / Training Plans</p></Reveal>
          <MaskedLines as="h2" style={{ ...BC, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.92, color: color.ink, fontSize: 'clamp(2rem,4vw,3.25rem)' }}
            lines={['WATCH YOUR PLAN', 'WRITE ITSELF.']} />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-sm" style={{ ...B, fontSize: '0.95rem', lineHeight: 1.7, color: color.inkDim }}>
              No generic drills. The AI reads your season, finds the weakness, and builds the week that fixes it.
            </p>
          </Reveal>
        </div>

        <div ref={ref}>
          <div className="rounded-lg p-6" style={{ background: color.surface, border: `1px solid ${color.border}`, boxShadow: 'inset 0 1px 0 rgba(226,224,240,0.04)' }}>
            {/* status sequence */}
            <div className="space-y-3 mb-6" aria-live="polite">
              {STEPS.map((s, i) => (
                <motion.div key={s} className="flex items-center gap-2.5"
                  initial={{ opacity: 0, x: -12 }}
                  animate={step > i ? { opacity: 1, x: 0 } : undefined}
                  transition={{ duration: 0.5, ease }}>
                  {step > i + 1 || step > STEPS.length ? (
                    <Check size={13} color={color.emerald} aria-hidden />
                  ) : (
                    <motion.span aria-hidden className="h-[13px] w-[13px] rounded-full border-2"
                      style={{ borderColor: AI, borderTopColor: 'transparent' }}
                      animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
                  )}
                  <span style={{ ...MONO, fontSize: '0.72rem', color: step > i + 1 ? color.inkMuted : color.inkDim }}>{s}</span>
                </motion.div>
              ))}
            </div>

            {/* plan cards */}
            <div className="space-y-3">
              {PLAN.map(({ d, f, t }, i) => (
                <motion.div key={d} className="flex items-center gap-4 rounded-md p-4"
                  style={{ background: color.bg, border: `1px solid ${color.border}` }}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={step > STEPS.length ? { opacity: 1, y: 0, scale: 1 } : undefined}
                  transition={{ duration: 0.6, delay: i * 0.15, ease }}>
                  <span className="shrink-0 w-11 text-center rounded py-1.5"
                    style={{ ...BC, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', background: 'rgba(255,90,60,0.14)', color: color.accentSoft }}>
                    {d}
                  </span>
                  <div>
                    <p style={{ ...BC, fontSize: '0.9rem', fontWeight: 700, color: color.ink, letterSpacing: '0.03em' }}>{f}</p>
                    <p style={{ ...B, fontSize: '0.72rem', color: color.inkMuted }}>{t}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
