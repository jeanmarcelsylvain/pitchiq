import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion, AnimatePresence, useScroll, useTransform,
  useSpring, useReducedMotion, useMotionValue,
} from 'framer-motion'
import Lenis from 'lenis'
import { X, ArrowUpRight, ArrowDown, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { color, font, ease as EASE } from '@/design/tokens'
import { Reveal, MaskedLines, Counter, Magnetic } from '@/design/motion'
import { WhyPitchIQ } from './landing/StoryIntro'
import { DashboardAssembly, SeasonTimeline, PitchIntelligence, FloatingStats } from './landing/DataSections'
import { AIReveal, TrainingPlanDemo } from './landing/AISections'
import { RecruitCard, Transformations, FinalCTA } from './landing/ProofSections'

/* Local aliases — all values come from the shared token system */
const ACCENT = color.accent
const BASE   = color.bg
const PANEL  = color.surface
const BORDER = color.border
const CREAM  = color.ink
const DIM    = color.inkDim
const MUTED  = color.inkMuted

const BC   = { fontFamily: font.display }
const B    = { fontFamily: font.ui }
const MONO = { fontFamily: font.mono }

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

/* ═══ Sign-in modal ══════════════════════════════════════════════════════════ */
function Modal({ onClose, onSignIn, loading }: { onClose: () => void; onSignIn: () => void; loading: boolean }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,7,18,0.85)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        style={{ background: PANEL, border: `1px solid ${BORDER}` }}
        className="w-full max-w-sm p-8"
        initial={{ y: 48, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 48, opacity: 0, scale: 0.97 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <span style={{ ...BC, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', color: CREAM }}>PITCHIQ</span>
          <button onClick={onClose} style={{ color: MUTED }} className="hover:text-white transition-colors"><X size={18}/></button>
        </div>
        <p style={{ ...BC, fontSize: '1.75rem', fontWeight: 700, color: CREAM, letterSpacing: '0.02em' }} className="mb-2">SIGN IN</p>
        <p style={{ ...B, color: MUTED, fontSize: '0.875rem' }} className="mb-8">Pick up right where you left off.</p>
        <button onClick={onSignIn} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 text-sm font-semibold disabled:opacity-50 transition-transform active:scale-[0.98]"
          style={{ ...B, background: CREAM, color: BASE, border: 'none' }}>
          <GoogleIcon />
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>
        <button onClick={onClose} className="w-full mt-3 py-3 text-sm transition-colors hover:text-white"
          style={{ ...B, color: MUTED, border: `1px solid ${BORDER}`, background: 'transparent' }}>
          New? Create account instead
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ═══ Page ═══════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const { enterDemoMode, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const reduced = useReducedMotion()

  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 })
  const heroImgScale = useTransform(scrollY, [0, 800], [1.08, 1.2])
  const heroTextY = useTransform(scrollY, [0, 600], [0, 140])
  const heroFade = useTransform(scrollY, [0, 500], [1, 0])

  /* Cursor depth — the stadium plate drifts a few px against the pointer */
  const pxRaw = useMotionValue(0)
  const pyRaw = useMotionValue(0)
  const parallaxX = useSpring(pxRaw, { stiffness: 40, damping: 22, mass: 1 })
  const parallaxY = useSpring(pyRaw, { stiffness: 40, damping: 22, mass: 1 })
  const onHeroMouse = (e: React.MouseEvent) => {
    if (reduced) return
    pxRaw.set((e.clientX / window.innerWidth - 0.5) * -18)
    pyRaw.set((e.clientY / window.innerHeight - 0.5) * -12)
  }

  /* Weighty, physical smooth scrolling */
  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: true })
    ;(window as Window & { __lenis?: Lenis }).__lenis = lenis
    let raf: number
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [reduced])

  useEffect(() => scrollY.on('change', v => setScrolled(v > 80)), [scrollY])

  const demo = () => { enterDemoMode(); navigate('/dashboard') }
  const signIn = async () => {
    setLoading(true)
    try { await signInWithGoogle() } finally { setLoading(false); setModal(false) }
  }

  const TICKER = ['GOALS', 'ASSISTS', 'PASS ACCURACY', 'SPRINT SPEED', 'DISTANCE COVERED', 'PERFORMANCE RATING', 'TRAINING SESSIONS', 'MATCH RESULTS']

  const sectionLabel: CSSProperties = { ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: MUTED }
  const h2Style: CSSProperties = { ...BC, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.92, color: CREAM }

  return (
    // overflowX must be 'clip', not 'hidden' — per spec, hidden on only one
    // axis forces the other axis to compute as 'auto', silently turning this
    // div into a scroll container and breaking every position:sticky
    // descendant (the AI reveal pin) against the real viewport.
    <div style={{ background: BASE, color: CREAM, overflowX: 'clip' }}>

      {/* Scroll progress — a hairline of accent along the top */}
      <motion.div className="fixed top-0 left-0 right-0 z-50 origin-left"
        style={{ height: 2, background: ACCENT, scaleX: progress }} />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 lg:px-10 h-14"
        style={{
          background: scrolled ? 'rgba(10,13,28,0.9)' : 'transparent',
          borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          transition: 'background 0.4s, border-color 0.4s',
        }}>
        <span style={{ ...BC, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', color: CREAM }}>PITCHIQ</span>
        <div className="flex items-center gap-2">
          <button onClick={demo} style={{ ...B, color: MUTED, fontSize: '0.8rem' }} className="hidden sm:block hover:text-white transition-colors px-3 py-1.5">
            Try Demo
          </button>
          <button onClick={() => setModal(true)} style={{ ...B, fontSize: '0.8rem', color: CREAM, border: `1px solid ${BORDER}`, padding: '6px 14px', background: 'transparent' }}
            className="hover:border-white transition-colors">
            Sign In
          </button>
          <button onClick={signIn} style={{ ...BC, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', background: ACCENT, color: BASE, padding: '7px 16px', border: 'none' }}
            className="hidden sm:block transition-transform active:scale-95">
            START FREE
          </button>
        </div>
      </nav>

      {/* Skip link — first focusable element on the page */}
      <a href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:px-4 focus:py-2"
        style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: ACCENT, color: BASE }}>
        SKIP TO CONTENT
      </a>

      {/* ── HERO — cinematic stadium open ────────────────────────────────── */}
      <section onMouseMove={onHeroMouse}
        className="relative min-h-screen flex flex-col justify-end pb-16 pt-32 px-6 lg:px-10 overflow-hidden">
        {/* Stadium photography: slow push-in + cursor depth drift */}
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            scale: reduced ? 1 : heroImgScale,
            x: parallaxX,
            y: parallaxY,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundImage: `url(/img/stadium-hero.jpg), radial-gradient(ellipse at 50% 20%, #26305a 0%, ${BASE} 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
        />
        {/* Grade: darken + vignette so type always reads */}
        <div aria-hidden className="absolute inset-0" style={{
          background: `linear-gradient(90deg, rgba(10,13,28,0.6) 0%, rgba(10,13,28,0.15) 55%, transparent 75%), linear-gradient(180deg, rgba(10,13,28,0.55) 0%, rgba(10,13,28,0.42) 40%, rgba(10,13,28,0.92) 88%, ${BASE} 100%)`,
        }} />

        {/* Floating match readout — the product, live in the hero (lg+) */}
        <motion.aside
          aria-label="Example match report"
          className="hidden lg:block absolute right-10 xl:right-20 top-1/2 z-10 w-[300px]"
          initial={{ opacity: 0, y: 40, rotate: 1.5 }}
          animate={{ opacity: 1, y: '-50%', rotate: 0 }}
          transition={{ duration: 1.2, delay: 1.4, ease: EASE }}
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="glass rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <span style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.18em', color: MUTED }}>LAST MATCH · VS ATLAS FC</span>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
            </div>
            <div className="flex items-end gap-3 mb-1">
              <span style={{ ...BC, fontSize: '3.25rem', fontWeight: 800, lineHeight: 0.9, color: CREAM, fontVariantNumeric: 'tabular-nums' }}>
                <Counter to={8.4} decimals={1} />
              </span>
              <span style={{ ...MONO, fontSize: '0.7rem', color: '#2dd4a0', paddingBottom: 4 }}>↑ 0.6 vs avg</span>
            </div>
            <p style={{ ...B, fontSize: '0.7rem', color: MUTED }} className="mb-5">Match rating</p>
            {([['Goals', 2, 66], ['Pass accuracy', '87%', 87], ['Sprint speed', '31.2 km/h', 78]] as const).map(([label, val, w], i) => (
              <div key={label} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span style={{ ...B, fontSize: '0.72rem', color: DIM }}>{label}</span>
                  <span style={{ ...MONO, fontSize: '0.7rem', color: CREAM }}>{val}</span>
                </div>
                <div className="h-[3px] rounded-full" style={{ background: 'rgba(37,43,77,0.9)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: ACCENT }}
                    initial={{ width: 0 }} animate={{ width: `${w}%` }}
                    transition={{ duration: 1, delay: 1.8 + i * 0.15, ease: EASE }} />
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p style={{ ...B, fontSize: '0.72rem', lineHeight: 1.5, color: '#7ab8ff' }}>
                <span style={{ ...BC, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.6rem' }}>AI COACH · </span>
                Your best ratings this season came at CM. Ask for more minutes there.
              </p>
            </div>
          </motion.div>
        </motion.aside>

        <motion.div style={{ y: reduced ? 0 : heroTextY, opacity: heroFade }} className="relative z-10">
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
            style={{ height: 2, background: ACCENT, transformOrigin: 'left', marginBottom: '2rem', maxWidth: 120 }} />

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }}
            style={{ ...BC, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.22em', color: DIM }} className="mb-6 uppercase">
            Soccer Performance Analytics · Ages 14–22
          </motion.p>

          <MaskedLines
            delay={0.25}
            style={{ ...BC, fontSize: 'clamp(3.5rem, 11vw, 9rem)', fontWeight: 800, lineHeight: 0.88, letterSpacing: '-0.02em', color: CREAM }}
            lines={[
              'KNOW',
              <span key="y" style={{ color: 'transparent', WebkitTextStroke: `2px ${CREAM}` }}>YOUR</span>,
              <span key="g" style={{ color: ACCENT }}>GAME.</span>,
            ]}
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: EASE }}
            style={{ ...B, color: DIM, fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 420, marginTop: '1.75rem' }}>
            Log every match. Track every trend. Get AI coaching built from your own numbers — not generic drills.
          </motion.p>

          <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.9, ease: EASE }}>
              <Magnetic>
                <button onClick={signIn}
                  className="transition-transform active:scale-95"
                  style={{ ...BC, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', background: ACCENT, color: BASE, padding: '14px 28px', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GoogleIcon /> SIGN UP FREE <ArrowUpRight size={14} />
                </button>
              </Magnetic>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1, ease: EASE }}>
              <Magnetic strength={0.18}>
                <button onClick={demo}
                  className="transition-colors hover:border-white"
                  style={{ ...BC, fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.08em', background: 'rgba(10,13,28,0.4)', backdropFilter: 'blur(6px)', color: DIM, padding: '14px 28px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  VIEW DEMO
                </button>
              </Magnetic>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.8 }}
            style={{ ...B, color: MUTED, fontSize: '0.75rem', marginTop: '1.5rem' }}>
            Free forever · AI from $4.99/mo · No credit card
          </motion.p>

          {/* Stat row */}
          <motion.div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-0 border-t"
            style={{ borderColor: 'rgba(37,43,77,0.8)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.9 }}>
            {[
              { n: 2400, s: '+', l: 'Matches Logged' },
              { n: 14,   s: '',  l: 'Metrics Tracked' },
              { n: 98,   s: '%', l: 'Retention' },
              { n: 500,  s: '+', l: 'Active Players' },
            ].map(({ n, s, l }, i) => (
              <div key={l} className="py-6 pr-6" style={{ borderRight: i < 3 ? `1px solid rgba(37,43,77,0.8)` : 'none', paddingLeft: i > 0 ? '1.5rem' : 0 }}>
                <div style={{ ...BC, fontSize: '2.5rem', fontWeight: 800, color: CREAM, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  <Counter to={n} suffix={s} />
                </div>
                <div style={{ ...B, fontSize: '0.7rem', color: MUTED, marginTop: '0.25rem' }}>{l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
          <motion.div animate={reduced ? undefined : { y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
            <ArrowDown size={16} color={MUTED} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── MARQUEE — pure CSS, decorative ─────────────────────────────────── */}
      <div aria-hidden style={{ background: ACCENT, overflow: 'hidden', padding: '14px 0' }}>
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap pr-12">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} style={{ ...BC, fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.18em', color: BASE }}>
              {t} ·
            </span>
          ))}
        </div>
      </div>

      {/* ═══ THE STORY — ten chapters, problem → proof → action ═══════════ */}
      <div id="main">
      <WhyPitchIQ />
      <DashboardAssembly />
      <SeasonTimeline />
      <PitchIntelligence />
      <FloatingStats />
      <AIReveal />
      <TrainingPlanDemo />
      <RecruitCard onCta={signIn} />
      <Transformations />

      {/* ── 06 / PRICING ──────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={sectionLabel} className="mb-4 uppercase">10 / Pricing</p>
          </Reveal>
          <MaskedLines as="h2" delay={0.05}
            style={{ ...h2Style, fontSize: 'clamp(2.5rem,5vw,4rem)', marginBottom: '4rem' }}
            lines={['START FREE.', "GO PRO WHEN YOU'RE READY."]} />

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            <Reveal>
              <motion.div whileHover={reduced ? undefined : { y: -4 }} transition={{ duration: 0.3, ease: EASE }}
                style={{ border: `1px solid ${BORDER}`, padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.18em', color: MUTED, marginBottom: '1rem' }}>FREE</p>
                <div style={{ ...BC, fontSize: '3.5rem', fontWeight: 900, color: CREAM, lineHeight: 1, marginBottom: '0.25rem' }}>$0</div>
                <p style={{ ...B, color: MUTED, fontSize: '0.8rem', marginBottom: '2rem' }}>Always free. No card needed.</p>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {['Unlimited match logging', 'Season stats dashboard', 'Goal tracking', 'Performance charts', 'Demo mode'].map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check size={13} color={ACCENT}/>
                      <span style={{ ...B, fontSize: '0.85rem', color: DIM }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={signIn} style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, padding: '12px', width: '100%' }}
                  className="hover:border-white transition-colors">
                  START FREE
                </button>
              </motion.div>
            </Reveal>

            <Reveal delay={0.1}>
              <motion.div whileHover={reduced ? undefined : { y: -4 }} transition={{ duration: 0.3, ease: EASE }}
                style={{ border: `2px solid ${ACCENT}`, padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(255,90,60,0.05)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.18em', color: ACCENT }}>PRO</p>
                  <span style={{ ...BC, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', background: ACCENT, color: BASE, padding: '2px 8px' }}>POPULAR</span>
                </div>
                <div style={{ ...BC, fontSize: '3.5rem', fontWeight: 900, color: CREAM, lineHeight: 1, marginBottom: '0.25rem' }}>$4.99</div>
                <p style={{ ...B, color: MUTED, fontSize: '0.8rem', marginBottom: '2rem' }}>Per month. Cancel anytime.</p>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {['Everything in Free', 'AI Coach analysis', 'Custom training plans', 'Injury tracker', 'Recruit profile page', 'Season archive'].map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check size={13} color={ACCENT}/>
                      <span style={{ ...B, fontSize: '0.85rem', color: DIM }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Magnetic strength={0.12}>
                  <button onClick={signIn} className="transition-transform active:scale-[0.98]"
                    style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: ACCENT, color: BASE, border: 'none', padding: '13px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    START WITH PRO <ArrowUpRight size={13}/>
                  </button>
                </Magnetic>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      <FinalCTA onSignIn={signIn} onDemo={demo} />
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '2rem 1.5rem' }} className="lg:px-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={{ ...BC, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.1em', color: MUTED }}>PITCHIQ</span>
          <p style={{ ...B, color: MUTED, fontSize: '0.75rem' }}>© 2025 PitchIQ · Built for players who want more than highlights.</p>
          <div className="flex gap-5" style={{ ...B, fontSize: '0.75rem', color: MUTED }}>
            <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms</span>
            <button onClick={() => setModal(true)} className="hover:text-white transition-colors">Sign In</button>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {modal && <Modal onClose={() => setModal(false)} onSignIn={signIn} loading={loading}/>}
      </AnimatePresence>
    </div>
  )
}
