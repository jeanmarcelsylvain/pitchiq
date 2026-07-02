import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion, useInView, AnimatePresence, useScroll, useTransform,
  useSpring, useReducedMotion, useMotionValue,
} from 'framer-motion'
import Lenis from 'lenis'
import { X, ArrowUpRight, ArrowDown, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/* ═══ Design tokens ══════════════════════════════════════════════════════════
   One palette, one easing curve, one timing scale — everything shares them. */
const ACCENT = '#ff5a3c'   // coral-orange
const BASE   = '#161025'   // deep indigo
const PANEL  = '#211a30'
const BORDER = '#3c3050'
const CREAM  = '#f4ede2'
const DIM    = '#e4d8f4'   // secondary text
const MUTED  = '#c0aed8'   // tertiary text

const BC   = { fontFamily: '"Barlow Condensed", sans-serif' }
const B    = { fontFamily: '"Barlow", sans-serif' }
const MONO = { fontFamily: '"JetBrains Mono", monospace' }

/* Signature curve — used by every transition on the page */
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ═══ Motion primitives ══════════════════════════════════════════════════════ */

/** Fade-up + blur-in on scroll. The workhorse reveal. */
function Reveal({ children, delay = 0, className = '', y = 36 }: {
  children: ReactNode; delay?: number; className?: string; y?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduced = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(6px)' }}
      animate={inView
        ? { opacity: 1, y: 0, filter: 'blur(0px)' }
        : undefined}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Headline lines rise out of a clipping mask, one line at a time. */
function MaskedLines({ lines, style, delay = 0, as: Tag = 'h1' }: {
  lines: ReactNode[]; style: CSSProperties; delay?: number; as?: 'h1' | 'h2'
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()
  return (
    <Tag ref={ref} style={style}>
      {lines.map((line, i) => (
        <span key={i} style={{ display: 'block', overflow: 'hidden' }}>
          <motion.span
            style={{ display: 'block' }}
            initial={reduced ? { opacity: 0 } : { y: '110%' }}
            animate={inView ? { y: 0, opacity: 1 } : undefined}
            transition={{ duration: 1, delay: delay + i * 0.09, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/** Numbers count up with a cubic ease-out once visible. */
function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const dur = 1800, start = performance.now()
    let raf: number
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1)
      setN((1 - Math.pow(1 - p, 3)) * to)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])
  return <span ref={ref}>{decimals ? n.toFixed(decimals) : Math.floor(n).toLocaleString()}{suffix}</span>
}

/** Buttons subtly follow the cursor — a magnetic pull, spring-released. */
function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 20, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 260, damping: 20, mass: 0.5 })
  const reduced = useReducedMotion()
  if (reduced) return <div>{children}</div>
  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

/** SVG line chart that draws itself when scrolled into view. */
function DrawnChart() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const linePath = 'M0,95 L40,82 L80,88 L120,65 L160,60 L200,42 L240,35 L280,22 L320,15'
  const dots: [number, number][] = [[0,95],[40,82],[80,88],[120,65],[160,60],[200,42],[240,35],[280,22],[320,15]]
  return (
    <svg ref={ref} viewBox="0 0 320 120" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 60, 90].map(gy => (
        <line key={gy} x1="0" y1={gy} x2="320" y2={gy} stroke="#332a44" strokeWidth="1" />
      ))}
      <motion.path
        d={`${linePath} L320,120 L0,120 Z`}
        fill="url(#chartFill)"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : undefined}
        transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
      />
      <motion.path
        d={linePath}
        fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : undefined}
        transition={{ duration: 1.6, ease: EASE }}
      />
      {dots.map(([cx, cy], i) => (
        <motion.circle
          key={i} cx={cx} cy={cy} r="3.5" fill={ACCENT}
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.4, delay: 0.15 * i + 0.2, ease: EASE }}
        />
      ))}
    </svg>
  )
}

/** Full-bleed cinematic image break with parallax. Falls back to a gradient
    until the production image exists at /img/<name>. */
function CinematicBreak({ img, children }: { img: string; children?: ReactNode }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const reduced = useReducedMotion()
  return (
    <section ref={ref} className="relative overflow-hidden" style={{ height: '70vh', minHeight: 420 }}>
      <motion.div
        className="absolute"
        style={{
          inset: '-15% 0',
          y: reduced ? 0 : y,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: `linear-gradient(rgba(22,16,37,0.45), rgba(22,16,37,0.72)), url(${img}), radial-gradient(ellipse at 50% 30%, #2a3555 0%, ${BASE} 75%)`,
        }}
      />
      <div className="relative h-full flex items-end px-6 lg:px-10 pb-16">
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </div>
    </section>
  )
}

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
  const heroImgScale = useTransform(scrollY, [0, 800], [1.05, 1.18])
  const heroTextY = useTransform(scrollY, [0, 600], [0, 140])
  const heroFade = useTransform(scrollY, [0, 500], [1, 0])

  /* Weighty, physical smooth scrolling */
  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
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
    <div style={{ background: BASE, color: CREAM, overflowX: 'hidden' }}>

      {/* Scroll progress — a hairline of accent along the top */}
      <motion.div className="fixed top-0 left-0 right-0 z-50 origin-left"
        style={{ height: 2, background: ACCENT, scaleX: progress }} />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 lg:px-10 h-14"
        style={{
          background: scrolled ? 'rgba(22,16,37,0.9)' : 'transparent',
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

      {/* ── HERO — cinematic stadium open ────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-16 pt-32 px-6 lg:px-10 overflow-hidden">
        {/* Stadium photography, slow push-in. PLACEHOLDER: drop production image at client/public/img/stadium-hero.jpg */}
        <motion.div
          className="absolute inset-0"
          style={{
            scale: reduced ? 1 : heroImgScale,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundImage: `url(/img/stadium-hero.jpg), radial-gradient(ellipse at 50% 20%, #223050 0%, ${BASE} 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
        />
        {/* Grade: darken + vignette so type always reads */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, rgba(22,16,37,0.55) 0%, rgba(22,16,37,0.35) 40%, rgba(22,16,37,0.92) 88%, ${BASE} 100%)`,
        }} />

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
            lines={['KNOW', 'YOUR', <span key="g" style={{ color: ACCENT }}>GAME.</span>]}
          />

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
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
                  style={{ ...BC, fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.08em', background: 'rgba(22,16,37,0.4)', backdropFilter: 'blur(6px)', color: DIM, padding: '14px 28px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
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
            style={{ borderColor: 'rgba(60,48,80,0.7)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.9 }}>
            {[
              { n: 2400, s: '+', l: 'Matches Logged' },
              { n: 14,   s: '',  l: 'Metrics Tracked' },
              { n: 98,   s: '%', l: 'Retention' },
              { n: 500,  s: '+', l: 'Active Players' },
            ].map(({ n, s, l }, i) => (
              <div key={l} className="py-6 pr-6" style={{ borderRight: i < 3 ? `1px solid rgba(60,48,80,0.7)` : 'none', paddingLeft: i > 0 ? '1.5rem' : 0 }}>
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

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <div style={{ background: ACCENT, overflow: 'hidden', padding: '14px 0' }}>
        <motion.div className="flex gap-12 whitespace-nowrap"
          animate={reduced ? undefined : { x: [0, -1200] }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}>
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} style={{ ...BC, fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.18em', color: BASE }}>
              {t} ·
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── 01 / THE PLATFORM ─────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-end">
          <div>
            <Reveal><p style={sectionLabel} className="mb-5 uppercase">01 / The Platform</p></Reveal>
            <MaskedLines as="h2" delay={0.1}
              style={{ ...h2Style, fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
              lines={['PERFORMANCE DATA', 'FOR PLAYERS WHO', 'TAKE IT SERIOUSLY.']} />
          </div>
          <div>
            <Reveal delay={0.15}>
              <p style={{ ...B, color: DIM, fontSize: '1.05rem', lineHeight: 1.7 }}>
                PitchIQ gives competitive youth soccer players — ECNL, club, high school — the same performance tracking infrastructure used at the pro level. Log every match. See every trend. Know exactly what to fix.
              </p>
              <div className="mt-8 flex gap-6 items-center">
                <Magnetic strength={0.15}>
                  <button onClick={signIn} style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: 'transparent', color: ACCENT, border: `1px solid ${ACCENT}`, padding: '10px 20px' }}
                    className="hover:bg-white/5 transition-colors">
                    START FREE →
                  </button>
                </Magnetic>
                <button onClick={demo} style={{ ...B, fontSize: '0.8rem', color: MUTED, textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none' }}
                  className="hover:text-white transition-colors">
                  See demo
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CINEMATIC BREAK — the pitch under lights ──────────────────────── */}
      {/* PLACEHOLDER: drop production image at client/public/img/stadium-player.jpg */}
      <CinematicBreak img="/img/stadium-player.jpg">
        <Reveal>
          <p style={{ ...BC, fontSize: 'clamp(1.5rem,3.5vw,2.75rem)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1, color: CREAM, maxWidth: 620 }}>
            EVERY TOUCH TELLS A STORY.<br />
            <span style={{ color: ACCENT }}>START WRITING YOURS DOWN.</span>
          </p>
        </Reveal>
      </CinematicBreak>

      {/* ── 02 / MATCH LOGGING ────────────────────────────────────────────── */}
      <section style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <Reveal><p style={sectionLabel} className="mb-16 uppercase">02 / Match Logging</p></Reveal>
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
            <Reveal>
              <div style={{ ...BC, fontSize: 'clamp(7rem,18vw,14rem)', fontWeight: 900, color: ACCENT, lineHeight: 1, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums' }}>
                <Counter to={14} />
              </div>
              <p style={{ ...B, color: MUTED, fontSize: '0.875rem', marginTop: '0.5rem' }}>metrics captured per match</p>
            </Reveal>
            <Reveal delay={0.12}>
              <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: '2rem' }}>
                <p style={{ ...BC, fontSize: '1.5rem', fontWeight: 700, color: CREAM, marginBottom: '1.5rem' }}>
                  Every number that matters. Zero that don't.
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {['Goals', 'Assists', 'Pass Accuracy', 'Sprint Speed', 'Distance', 'Match Rating', 'Position', 'Minutes', 'Shots on Target', 'Duels Won', 'Competition', 'Result'].map((m, i) => (
                    <motion.div key={m} className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.04 * i, ease: EASE }}>
                      <div style={{ width: 4, height: 4, background: ACCENT, flexShrink: 0 }} />
                      <span style={{ ...B, color: DIM, fontSize: '0.8rem' }}>{m}</span>
                    </motion.div>
                  ))}
                </div>
                <p style={{ ...B, color: MUTED, fontSize: '0.75rem', marginTop: '1.5rem' }}>Log a full match in under 60 seconds.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 03 / ANALYTICS ────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal><p style={sectionLabel} className="mb-16 uppercase">03 / Analytics</p></Reveal>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
            <Reveal>
              <div style={{ border: `1px solid ${BORDER}`, background: PANEL, padding: '2rem' }}>
                <div className="flex items-center justify-between mb-6">
                  <span style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.16em', color: MUTED }}>RATING TREND — SEASON 2025</span>
                  <span style={{ ...MONO, fontSize: '0.7rem', color: ACCENT }}>↑ <Counter to={18} suffix="%" /></span>
                </div>
                <DrawnChart />
                <div className="flex justify-between mt-3">
                  {['AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR','APR'].map(m => (
                    <span key={m} style={{ ...BC, fontSize: '0.6rem', color: MUTED }}>{m}</span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <MaskedLines as="h2" style={{ ...h2Style, fontSize: 'clamp(2rem,4vw,3.5rem)', marginBottom: '1.5rem' }}
                lines={['SEE THE TREND', 'BEFORE YOUR', 'COACH DOES.']} />
              <p style={{ ...B, color: MUTED, lineHeight: 1.7, fontSize: '0.95rem' }}>
                Interactive charts surface performance patterns across your entire season. Compare form across positions, identify training load correlations, and spot your peak windows.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[['Rating Trend', 'by match'], ['Pass Accuracy', 'over time'], ['Goals/Assists', 'ratio'], ['Sprint Speed', 'progression']].map(([a, b]) => (
                  <div key={a} style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '0.75rem' }}>
                    <div style={{ ...BC, fontSize: '0.8rem', fontWeight: 700, color: CREAM }}>{a}</div>
                    <div style={{ ...B, fontSize: '0.7rem', color: MUTED }}>{b}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 04 / AI COACH ─────────────────────────────────────────────────── */}
      <section style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal><p style={sectionLabel} className="mb-16 uppercase">04 / AI Tools · Pro</p></Reveal>
          <div className="grid lg:grid-cols-2 gap-16">
            <Reveal>
              <MaskedLines as="h2" style={{ ...h2Style, fontSize: 'clamp(2rem,4vw,3.5rem)' }}
                lines={['AN AI COACH', 'THAT READS', 'YOUR NUMBERS.']} />
              <p style={{ ...B, color: MUTED, lineHeight: 1.7, fontSize: '0.95rem', marginTop: '1.5rem' }}>
                PitchIQ Pro includes an AI Coach that analyzes your match history and generates personalized training plans — not generic advice, but recommendations built from your specific data.
              </p>
              <div style={{ marginTop: '2rem' }}>
                <Magnetic strength={0.15}>
                  <button onClick={signIn} className="transition-transform active:scale-95"
                    style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: ACCENT, color: BASE, padding: '12px 24px', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    TRY PRO — $4.99/MO <ArrowUpRight size={13}/>
                  </button>
                </Magnetic>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div style={{ border: `1px solid ${BORDER}`, padding: '1.5rem', background: BASE }}>
                <div className="flex items-center gap-2 mb-4">
                  <motion.div style={{ width: 6, height: 6, background: ACCENT }}
                    animate={reduced ? undefined : { opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.18em', color: MUTED }}>AI COACH INSIGHT</span>
                </div>
                {[
                  { tag: 'IMPROVEMENT', text: 'Your pass accuracy drops 12% when you play LW vs CM. Suggest more positional training at left wing.', color: ACCENT },
                  { tag: 'TREND', text: 'Sprint speed has improved 8.3% over the last 6 matches — consistent with your new interval training load.', color: '#60b8ff' },
                  { tag: 'ACTION', text: 'You\'ve played 3 matches in 8 days. Recommend a recovery session before Saturday to maintain peak output.', color: '#ffba08' },
                ].map(({ tag, text, color }, i) => (
                  <motion.div key={tag} style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1rem', marginTop: '1rem' }}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15 * i, ease: EASE }}>
                    <span style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.14em', color, fontWeight: 700 }}>{tag}</span>
                    <p style={{ ...B, fontSize: '0.8rem', color: DIM, lineHeight: 1.5, marginTop: '0.35rem' }}>{text}</p>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CINEMATIC BREAK + PULLQUOTE ───────────────────────────────────── */}
      {/* PLACEHOLDER: drop production image at client/public/img/stadium-kick.jpg */}
      <CinematicBreak img="/img/stadium-kick.jpg">
        <Reveal>
          <p style={{ ...BC, fontSize: 'clamp(1.75rem,4.5vw,3.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.95, color: CREAM, maxWidth: 900 }}>
            "I USED TO GUESS WHERE MY GAME WAS WEAK.<br />NOW I JUST LOOK AT THE DATA."
          </p>
          <div className="flex items-center gap-3 mt-8">
            <div style={{ width: 1, height: 32, background: ACCENT }} />
            <div>
              <p style={{ ...BC, fontSize: '0.8rem', fontWeight: 700, color: CREAM }}>ALEX RIVERA</p>
              <p style={{ ...B, fontSize: '0.7rem', color: DIM }}>ECNL Player · Forward · U18</p>
            </div>
          </div>
        </Reveal>
      </CinematicBreak>

      {/* ── 05 / PROCESS ──────────────────────────────────────────────────── */}
      <section style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal><p style={sectionLabel} className="mb-16 uppercase">05 / Process</p></Reveal>
          <div className="grid md:grid-cols-3 gap-0">
            {[
              { n: '01', t: 'LOG YOUR MATCH', b: 'After every game, spend 60 seconds entering your stats. Goals, assists, rating, position, sprint speed.' },
              { n: '02', t: 'TRACK TRENDS', b: 'Charts update automatically. Watch your season arc build — see what\'s improving, what needs work.' },
              { n: '03', t: 'ELEVATE YOUR GAME', b: 'Use data-driven insights and AI coaching to attack your specific weaknesses before the next kickoff.' },
            ].map(({ n, t, b }, i) => (
              <Reveal key={n} delay={i * 0.1}>
                <div style={{ borderTop: `2px solid ${i === 0 ? ACCENT : BORDER}`, paddingTop: '2rem', paddingRight: i < 2 ? '3rem' : 0, marginRight: i < 2 ? '3rem' : 0, borderRight: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                  <p style={{ ...BC, fontSize: '3.5rem', fontWeight: 900, color: '#473a5c', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>{n}</p>
                  <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: CREAM, letterSpacing: '0.04em', marginBottom: '0.75rem' }}>{t}</p>
                  <p style={{ ...B, color: MUTED, fontSize: '0.875rem', lineHeight: 1.65 }}>{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 06 / PRICING ──────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={sectionLabel} className="mb-4 uppercase">06 / Pricing</p>
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

      {/* ── FINAL CTA — inverted block ────────────────────────────────────── */}
      <section style={{ background: ACCENT }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-end">
          <MaskedLines as="h2"
            style={{ ...BC, fontSize: 'clamp(3rem,7vw,5.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.88, color: BASE }}
            lines={['YOUR NEXT', 'LEVEL STARTS', 'NOW.']} />
          <Reveal delay={0.12}>
            <p style={{ ...B, color: '#3a1208', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Join hundreds of competitive youth players who track their development with PitchIQ. Free to start — takes 2 minutes to set up.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Magnetic strength={0.15}>
                <button onClick={signIn} className="transition-transform active:scale-95"
                  style={{ ...BC, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', background: BASE, color: ACCENT, padding: '14px 28px', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GoogleIcon /> SIGN UP FREE
                </button>
              </Magnetic>
              <button onClick={demo} className="hover:bg-black/10 transition-colors"
                style={{ ...BC, fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.08em', background: 'transparent', color: BASE, padding: '14px 28px', border: `1px solid rgba(0,0,0,0.3)` }}>
                VIEW DEMO FIRST
              </button>
            </div>
          </Reveal>
        </div>
      </section>

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
