/* ═══ ACT IV — confidence. Growth. Elite performance. ═══════════════════════
   08: the recruit card — a shareable player card worthy of a club.
   09: transformations — growth curves, not testimonials.
   10: the cinematic close — dark stadium, one spotlight, one message. */
import { useRef, type ReactNode } from 'react'
import {
  motion, useScroll, useTransform, useInView, useReducedMotion,
  useMotionValue, useSpring,
} from 'framer-motion'
import { ArrowUpRight, Share2 } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { Reveal, MaskedLines, Counter, Magnetic } from '@/design/motion'

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

const label = { ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: color.inkMuted } as const
const h2 = { ...BC, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.92, color: color.ink } as const

/* ── 08 · RECRUIT CARD ───────────────────────────────────────────────────── */

function TiltCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 18 })
  const sry = useSpring(ry, { stiffness: 120, damping: 18 })
  const reduced = useReducedMotion()
  if (reduced) return <div>{children}</div>
  return (
    <motion.div
      ref={ref}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 10)
        rx.set(((e.clientY - r.top) / r.height - 0.5) * -8)
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0) }}
    >
      {children}
    </motion.div>
  )
}

const ATTRS: [string, number][] = [['SCORING', 84], ['PASSING', 86], ['PACE', 89], ['STAMINA', 82], ['VISION', 78]]

export function RecruitCard({ onCta }: { onCta: () => void }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20%' })
  return (
    <section className="px-6 lg:px-10 py-28 relative overflow-hidden" style={{ background: color.surface, borderBottom: `1px solid ${color.border}` }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 45% at 80% 30%, rgba(255,90,60,0.06), transparent 70%)' }} />
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center relative">
        <div className="order-2 lg:order-1 flex justify-center" style={{ perspective: 900 }}>
          <Reveal>
            <TiltCard>
              <div ref={ref} className="w-[320px] sm:w-[350px] rounded-xl overflow-hidden shadow-float"
                style={{ border: `1px solid ${color.borderHi}`, background: color.bg }}>
                {/* portrait — masked, graded, never "an image in a card" */}
                <div className="relative h-56 overflow-hidden">
                  <div aria-hidden className="absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(10,13,28,0.1), ${color.bg} 96%), url(/img/stadium-player.jpg)`,
                      backgroundSize: 'cover', backgroundPosition: 'center 20%',
                    }} />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.18em', color: color.inkDim }}>PITCHIQ RECRUIT PROFILE</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p style={{ ...BC, fontSize: '1.75rem', fontWeight: 800, lineHeight: 0.95, color: color.ink, letterSpacing: '0.01em' }}>ALEX RIVERA</p>
                      <p style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }}>CM · U18 · FC United Academy</p>
                    </div>
                    <div className="text-right">
                      <p style={{ ...BC, fontSize: '2.25rem', fontWeight: 900, lineHeight: 1, color: color.accent, fontVariantNumeric: 'tabular-nums' }}>
                        <Counter to={84} />
                      </p>
                      <p style={{ ...BC, fontSize: '0.55rem', letterSpacing: '0.16em', color: color.inkMuted }}>OVERALL</p>
                    </div>
                  </div>
                </div>
                {/* animated attribute bars */}
                <div className="p-5 space-y-3">
                  {ATTRS.map(([a, v], i) => (
                    <div key={a}>
                      <div className="flex justify-between mb-1">
                        <span style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.14em', color: color.inkMuted }}>{a}</span>
                        <span style={{ ...MONO, fontSize: '0.65rem', color: color.ink }}>{v}</span>
                      </div>
                      <div className="h-[3px] rounded-full" style={{ background: color.border }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: v >= 85 ? color.accent : color.inkDim }}
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${v}%` } : undefined}
                          transition={{ duration: 1, delay: 0.4 + i * 0.12, ease }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${color.border}` }}>
                    <span style={{ ...MONO, fontSize: '0.62rem', color: color.inkMuted }}>22 matches · verified stats</span>
                    <span className="flex items-center gap-1.5" style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.12em', color: color.accentSoft }}>
                      <Share2 size={11} aria-hidden /> SHARE LINK
                    </span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>

        <div className="order-1 lg:order-2">
          <Reveal><p className="uppercase mb-5" style={label}>08 / Recruit Profile</p></Reveal>
          <MaskedLines as="h2" style={{ ...h2, fontSize: 'clamp(2.25rem,4.5vw,3.75rem)' }}
            lines={['A PLAYER CARD', 'SCOUTS ACTUALLY', 'OPEN.']} />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md" style={{ ...B, fontSize: '1rem', lineHeight: 1.7, color: color.inkDim }}>
              One link. Your whole season — verified stats, attribute ratings, and trend lines a coach can read in thirty seconds. No more highlight-reel guesswork.
            </p>
            <div className="mt-8">
              <Magnetic strength={0.15}>
                <button onClick={onCta} className="transition-transform active:scale-95"
                  style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: 'transparent', color: color.accent, border: `1px solid ${color.accent}`, padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  BUILD YOURS <ArrowUpRight size={13} aria-hidden />
                </button>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ── 09 · TRANSFORMATIONS — growth, not testimonials ─────────────────────── */

const GROWTH = [
  { n: 'MIA T.', p: 'Winger · U16', from: 6.4, to: 7.9, months: 7, spark: 'M0,30 L20,28 L40,29 L60,22 L80,18 L100,12 L120,7', quote: 'Found out I score 80% of my goals in the first half. Fixed my fitness. Doubled my second-half output.' },
  { n: 'JORDAN K.', p: 'CM · U18', from: 6.9, to: 8.2, months: 9, spark: 'M0,28 L20,26 L40,20 L60,21 L80,14 L100,10 L120,5', quote: 'The data got me moved to centre-mid. Best decision of my career — and it wasn\'t even my idea. It was the numbers\'.' },
  { n: 'SOFIA R.', p: 'Striker · U17', from: 5.8, to: 7.4, months: 11, spark: 'M0,32 L20,30 L40,27 L60,24 L80,20 L100,13 L120,8', quote: 'Committed to a D1 program. My recruit profile did the talking before I ever got a trial.' },
]

export function Transformations() {
  return (
    <section className="px-6 lg:px-10 py-28 relative overflow-hidden" style={{ borderBottom: `1px solid ${color.border}` }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(56,64,110,0.2), transparent 70%)' }} />
      <div className="max-w-6xl mx-auto relative">
        <Reveal><p className="uppercase mb-5" style={label}>09 / Transformations</p></Reveal>
        <div className="grid lg:grid-cols-2 gap-6 items-end mb-16">
          <MaskedLines as="h2" style={{ ...h2, fontSize: 'clamp(2.25rem,4.5vw,3.75rem)' }}
            lines={['NOT TESTIMONIALS.', 'TRAJECTORIES.']} />
          <Reveal delay={0.15}>
            <p style={{ ...B, fontSize: '1rem', lineHeight: 1.7, color: color.inkDim }} className="lg:max-w-sm lg:ml-auto">
              Every card below is a season arc — a player who found the pattern in their numbers and changed it.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {GROWTH.map(({ n, p, from, to, months, spark, quote }, i) => (
            <Reveal key={n} delay={i * 0.1}>
              <motion.div className="rounded-lg p-6 h-full flex flex-col"
                style={{ background: color.surface, border: `1px solid ${color.border}`, boxShadow: 'inset 0 1px 0 rgba(226,224,240,0.04)' }}
                whileHover={{ y: -6, borderColor: color.borderHi, transition: { duration: 0.3, ease } }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p style={{ ...BC, fontSize: '1.1rem', fontWeight: 800, color: color.ink, letterSpacing: '0.02em' }}>{n}</p>
                    <p style={{ ...B, fontSize: '0.7rem', color: color.inkMuted }}>{p}</p>
                  </div>
                  <span style={{ ...MONO, fontSize: '0.62rem', color: color.inkMuted }}>{months} mo</span>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <span style={{ ...BC, fontSize: '1.4rem', fontWeight: 700, color: color.inkMuted, fontVariantNumeric: 'tabular-nums' }}>{from.toFixed(1)}</span>
                  <span aria-hidden style={{ color: color.accent, paddingBottom: 2 }}>→</span>
                  <span style={{ ...BC, fontSize: '2.5rem', fontWeight: 900, lineHeight: 0.9, color: color.accent, fontVariantNumeric: 'tabular-nums' }}>
                    <Counter to={to} decimals={1} />
                  </span>
                  <span style={{ ...B, fontSize: '0.65rem', color: color.inkMuted, paddingBottom: 4 }}>avg rating</span>
                </div>
                <GrowthSpark d={spark} />
                <p className="mt-5" style={{ ...B, fontSize: '0.82rem', lineHeight: 1.6, color: color.inkDim }}>"{quote}"</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function GrowthSpark({ d }: { d: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <svg ref={ref} viewBox="0 0 120 36" className="w-full" aria-hidden>
      <motion.path d={d} fill="none" stroke={color.accent} strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : undefined}
        transition={{ duration: 1.4, delay: 0.5, ease }} />
    </svg>
  )
}

/* ── 10 · FINAL CTA — one spotlight, one message ─────────────────────────── */

export function FinalCTA({ onSignIn, onDemo }: { onSignIn: () => void; onDemo: () => void }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])
  const light = useTransform(scrollYProgress, [0.1, 0.5], [0, 1])

  return (
    <section ref={ref} className="relative overflow-hidden flex items-center justify-center"
      style={{ minHeight: '95vh' }}>
      {/* stadium plate, parallax */}
      <motion.div aria-hidden className="absolute"
        style={{
          inset: '-12% 0', y: reduced ? 0 : imgY,
          backgroundImage: `linear-gradient(rgba(10,13,28,0.82), rgba(10,13,28,0.86)), url(/img/stadium-kick.jpg), radial-gradient(ellipse at 50% 40%, #26305a 0%, ${color.bg} 75%)`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      {/* floodlight cone — fades in with scroll */}
      <motion.div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ opacity: reduced ? 1 : light, background: 'radial-gradient(ellipse 42% 55% at 50% 0%, rgba(226,224,240,0.14), transparent 65%)' }} />

      <div className="relative z-10 text-center px-6 py-32">
        <MaskedLines as="h2"
          style={{ ...BC, fontSize: 'clamp(3rem,9vw,7.5rem)', fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em', color: color.ink, textAlign: 'center' }}
          lines={['THE NEXT LEVEL', <span key="m" style={{ color: color.accent }}>IS MEASURED.</span>]} />
        <Reveal delay={0.3}>
          <p className="mx-auto mt-8 max-w-md" style={{ ...B, fontSize: '1rem', lineHeight: 1.7, color: color.inkDim }}>
            Start tonight. Log your last match from memory — it's the last time you'll ever have to.
          </p>
        </Reveal>
        <Reveal delay={0.45}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Magnetic>
              <button onClick={onSignIn} className="transition-transform active:scale-95"
                style={{ ...BC, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.08em', background: color.accent, color: color.bg, padding: '16px 36px', border: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                START FREE <ArrowUpRight size={15} aria-hidden />
              </button>
            </Magnetic>
            <button onClick={onDemo} className="transition-colors hover:text-white"
              style={{ ...B, fontSize: '0.85rem', color: color.inkMuted, textDecoration: 'underline', textUnderlineOffset: 4, background: 'none', border: 'none' }}>
              or walk through the demo first
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
