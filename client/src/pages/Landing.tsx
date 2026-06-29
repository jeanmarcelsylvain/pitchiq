import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { X, ArrowUpRight, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/* ─── Constants ───────────────────────────────────────────────────────────── */
const LIME   = '#d4ff00'
const BLACK  = '#080808'
const CREAM  = '#f5f2ea'
const GRAY   = '#111111'
const BORDER = '#2e2e2e'
const DIM    = '#c0bdb5'   // bright secondary text
const MUTED  = '#888880'   // tertiary text

const BC = { fontFamily: '"Barlow Condensed", sans-serif' }
const B  = { fontFamily: '"Barlow", sans-serif' }
const MONO = { fontFamily: '"JetBrains Mono", monospace' }

const reveal: Variants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} variants={reveal} initial="hidden" animate={inView ? 'show' : 'hidden'}
      transition={{ delay }} className={className}>
      {children}
    </motion.div>
  )
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const dur = 1600, start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      setN(Math.floor((1 - Math.pow(1 - p, 3)) * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, to])
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>
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

/* ─── Modal ───────────────────────────────────────────────────────────────── */
function Modal({ onClose, onSignIn, loading }: { onClose: () => void; onSignIn: () => void; loading: boolean }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        style={{ background: GRAY, border: `1px solid ${BORDER}`, borderRadius: 0 }}
        className="w-full max-w-sm p-8"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <span style={{ ...BC, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', color: CREAM }}>PITCHIQ</span>
          <button onClick={onClose} style={{ color: MUTED }} className="hover:text-white transition-colors"><X size={18}/></button>
        </div>
        <p style={{ ...BC, fontSize: '1.75rem', fontWeight: 700, color: CREAM, letterSpacing: '0.02em' }} className="mb-2">SIGN IN</p>
        <p style={{ ...B, color: MUTED, fontSize: '0.875rem' }} className="mb-8">Pick up right where you left off.</p>
        <button onClick={onSignIn} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 text-sm font-semibold disabled:opacity-50"
          style={{ ...B, background: CREAM, color: BLACK, border: 'none' }}>
          <GoogleIcon />
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>
        <button onClick={onClose} className="w-full mt-3 py-3 text-sm"
          style={{ ...B, color: MUTED, border: `1px solid ${BORDER}`, background: 'transparent' }}>
          New? Create account instead
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function Landing() {
  const { enterDemoMode, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 120])
  const heroO = useTransform(scrollY, [0, 400], [1, 0])

  useEffect(() => scrollY.on('change', v => setScrolled(v > 80)), [scrollY])

  const demo   = () => { enterDemoMode(); navigate('/dashboard') }
  const signIn = async () => {
    setLoading(true)
    try { await signInWithGoogle() } finally { setLoading(false); setModal(false) }
  }

  const TICKER = ['GOALS', 'ASSISTS', 'PASS ACCURACY', 'SPRINT SPEED', 'DISTANCE COVERED', 'PERFORMANCE RATING', 'TRAINING SESSIONS', 'MATCH RESULTS']

  return (
    <div style={{ background: BLACK, color: CREAM, overflowX: 'hidden' }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 lg:px-10 h-14"
        style={{ background: scrolled ? 'rgba(8,8,8,0.96)' : 'transparent', borderBottom: scrolled ? `1px solid ${BORDER}` : 'none', backdropFilter: scrolled ? 'blur(12px)' : 'none', transition: 'all 0.3s' }}>
        <span style={{ ...BC, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', color: CREAM }}>PITCHIQ</span>
        <div className="flex items-center gap-2">
          <button onClick={demo} style={{ ...B, color: MUTED, fontSize: '0.8rem' }} className="hidden sm:block hover:text-white transition-colors px-3 py-1.5">
            Try Demo
          </button>
          <button onClick={() => setModal(true)} style={{ ...B, fontSize: '0.8rem', color: CREAM, border: `1px solid ${BORDER}`, padding: '6px 14px', background: 'transparent' }}
            className="hover:border-white transition-colors">
            Sign In
          </button>
          <button onClick={signIn} style={{ ...BC, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', background: LIME, color: BLACK, padding: '7px 16px', border: 'none' }}
            className="hidden sm:block">
            START FREE
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 pt-32 px-6 lg:px-10 overflow-hidden">
        {/* Big decorative number behind */}
        <motion.div style={{ y: heroY, opacity: heroO }}
          className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none select-none overflow-hidden">
          <span style={{ ...BC, fontSize: 'clamp(220px, 40vw, 480px)', fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: '-0.04em', userSelect: 'none' }}>
            IQ
          </span>
        </motion.div>

        {/* Lime horizontal rule */}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease: [0.16,1,0.3,1] as [number,number,number,number] }}
          style={{ height: 2, background: LIME, transformOrigin: 'left', marginBottom: '2rem', maxWidth: 120 }} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <p style={{ ...BC, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.22em', color: MUTED }} className="mb-6 uppercase">
            Soccer Performance Analytics · Ages 14–22
          </p>
        </motion.div>

        <motion.h1
          style={{ ...BC, fontSize: 'clamp(3.5rem, 11vw, 9rem)', fontWeight: 800, lineHeight: 0.88, letterSpacing: '-0.02em', color: CREAM, position: 'relative', zIndex: 1 }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16,1,0.3,1] as [number,number,number,number] }}>
          KNOW<br />
          YOUR<br />
          <span style={{ color: LIME }}>GAME.</span>
        </motion.h1>

        <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 relative z-10">
          <motion.button onClick={signIn}
            style={{ ...BC, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', background: LIME, color: BLACK, padding: '14px 28px', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <GoogleIcon />
            SIGN UP FREE
            <ArrowUpRight size={14} />
          </motion.button>
          <motion.button onClick={demo}
            style={{ ...BC, fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.08em', background: 'transparent', color: DIM, padding: '14px 28px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            whileHover={{ borderColor: '#555', color: CREAM }} className="transition-colors">
            VIEW DEMO
          </motion.button>
        </div>

        <motion.p style={{ ...B, color: MUTED, fontSize: '0.75rem', marginTop: '1.5rem' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Free forever · AI from $4.99/mo · No credit card
        </motion.p>

        {/* Bottom stat row */}
        <motion.div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-0 border-t relative z-10"
          style={{ borderColor: BORDER }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {[
            { n: 2400, s: '+', l: 'Matches Logged' },
            { n: 14,   s: '',  l: 'Metrics Tracked' },
            { n: 98,   s: '%', l: 'Retention' },
            { n: 500,  s: '+', l: 'Active Players' },
          ].map(({ n, s, l }, i) => (
            <div key={l} className="py-6 pr-6" style={{ borderRight: i < 3 ? `1px solid ${BORDER}` : 'none', paddingLeft: i > 0 ? '1.5rem' : 0 }}>
              <div style={{ ...BC, fontSize: '2.5rem', fontWeight: 800, color: CREAM, letterSpacing: '-0.03em', lineHeight: 1 }}>
                <Counter to={n} suffix={s} />
              </div>
              <div style={{ ...B, fontSize: '0.7rem', color: MUTED, marginTop: '0.25rem' }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <div style={{ background: LIME, overflow: 'hidden', borderTop: 'none', padding: '14px 0' }}>
        <motion.div className="flex gap-12 whitespace-nowrap"
          animate={{ x: [0, -1200] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex' }}>
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} style={{ ...BC, fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.18em', color: BLACK }}>
              {t} ·
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── SECTION 01 — What it is ────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-end">
          <div>
            <Reveal>
              <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: MUTED }} className="mb-5 uppercase">01 / The Platform</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 style={{ ...BC, fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.92, color: CREAM }}>
                PERFORMANCE DATA<br />
                FOR PLAYERS WHO<br />
                TAKE IT SERIOUSLY.
              </h2>
            </Reveal>
          </div>
          <div>
            <Reveal delay={0.1}>
              <p style={{ ...B, color: DIM, fontSize: '1.05rem', lineHeight: 1.7 }}>
                PitchIQ gives competitive youth soccer players — ECNL, club, high school — the same performance tracking infrastructure used at the pro level. Log every match. See every trend. Know exactly what to fix.
              </p>
              <div className="mt-8 flex gap-6">
                <button onClick={signIn} style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: 'transparent', color: LIME, border: `1px solid ${LIME}`, padding: '10px 20px' }}
                  className="hover:bg-lime-500/10 transition-colors">
                  START FREE →
                </button>
                <button onClick={demo} style={{ ...B, fontSize: '0.8rem', color: MUTED, textDecoration: 'underline', background: 'none', border: 'none' }}
                  className="hover:text-white transition-colors">
                  See demo
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SECTION 02 — Big number feature ──────────────────────────────── */}
      <section style={{ background: GRAY, borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: MUTED }} className="mb-16 uppercase">02 / Match Logging</p>
          </Reveal>

          {/* Big layout: number left, list right */}
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
            <Reveal>
              <div style={{ ...BC, fontSize: 'clamp(7rem,18vw,14rem)', fontWeight: 900, color: LIME, lineHeight: 1, letterSpacing: '-0.05em' }}>
                14
              </div>
              <p style={{ ...B, color: MUTED, fontSize: '0.875rem', marginTop: '0.5rem' }}>
                metrics captured per match
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: '2rem' }}>
                <p style={{ ...BC, fontSize: '1.5rem', fontWeight: 700, color: CREAM, marginBottom: '1.5rem' }}>
                  Every number that matters. Zero that don't.
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {['Goals', 'Assists', 'Pass Accuracy', 'Sprint Speed', 'Distance', 'Match Rating', 'Position', 'Minutes', 'Shots on Target', 'Duels Won', 'Competition', 'Result'].map(m => (
                    <div key={m} className="flex items-center gap-2">
                      <div style={{ width: 4, height: 4, background: LIME, borderRadius: 0, flexShrink: 0 }} />
                      <span style={{ ...B, color: DIM, fontSize: '0.8rem' }}>{m}</span>
                    </div>
                  ))}
                </div>
                <p style={{ ...B, color: MUTED, fontSize: '0.75rem', marginTop: '1.5rem' }}>
                  Log a full match in under 60 seconds.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SECTION 03 — Trend line feature ──────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: MUTED }} className="mb-16 uppercase">03 / Analytics</p>
          </Reveal>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
            {/* Chart visual */}
            <Reveal>
              <div style={{ border: `1px solid ${BORDER}`, background: GRAY, padding: '2rem' }}>
                <div className="flex items-center justify-between mb-6">
                  <span style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.16em', color: MUTED }}>RATING TREND — SEASON 2025</span>
                  <span style={{ ...MONO, fontSize: '0.7rem', color: LIME }}>↑ 18%</span>
                </div>
                <svg viewBox="0 0 320 120" className="w-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LIME} stopOpacity="0.2"/>
                      <stop offset="100%" stopColor={LIME} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* grid lines */}
                  {[30,60,90].map(y => <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#222" strokeWidth="1"/>)}
                  {/* area fill */}
                  <path d="M0,95 L40,82 L80,88 L120,65 L160,60 L200,42 L240,35 L280,22 L320,15 L320,120 L0,120 Z" fill="url(#g1)"/>
                  {/* line */}
                  <path d="M0,95 L40,82 L80,88 L120,65 L160,60 L200,42 L240,35 L280,22 L320,15" fill="none" stroke={LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* dots */}
                  {([[0,95],[40,82],[80,88],[120,65],[160,60],[200,42],[240,35],[280,22],[320,15]] as [number,number][]).map(([x,y], i) => (
                    <circle key={i} cx={x} cy={y} r="3.5" fill={LIME}/>
                  ))}
                </svg>
                <div className="flex justify-between mt-3">
                  {['AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR','APR'].map(m => (
                    <span key={m} style={{ ...BC, fontSize: '0.6rem', color: MUTED }}>{m}</span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 style={{ ...BC, fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.92, color: CREAM, marginBottom: '1.5rem' }}>
                SEE THE TREND<br />
                BEFORE YOUR<br />
                COACH DOES.
              </h2>
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

      {/* ── SECTION 04 — AI Coach ─────────────────────────────────────────── */}
      <section style={{ background: GRAY, borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: MUTED }} className="mb-16 uppercase">04 / AI Tools · Pro</p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-16">
            <Reveal>
              <h2 style={{ ...BC, fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.92, color: CREAM }}>
                AN AI COACH<br />
                THAT READS<br />
                YOUR NUMBERS.
              </h2>
              <p style={{ ...B, color: MUTED, lineHeight: 1.7, fontSize: '0.95rem', marginTop: '1.5rem' }}>
                PitchIQ Pro includes an AI Coach that analyzes your match history and generates personalized training plans — not generic advice, but recommendations built from your specific data.
              </p>
              <button onClick={signIn} style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: LIME, color: BLACK, padding: '12px 24px', border: 'none', marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                TRY PRO — $4.99/MO <ArrowUpRight size={13}/>
              </button>
            </Reveal>

            <Reveal delay={0.1}>
              {/* Mock AI insight card */}
              <div style={{ border: `1px solid ${BORDER}`, padding: '1.5rem', background: BLACK }}>
                <div className="flex items-center gap-2 mb-4">
                  <div style={{ width: 6, height: 6, background: LIME, borderRadius: 0 }} />
                  <span style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.18em', color: MUTED }}>AI COACH INSIGHT</span>
                </div>
                {[
                  { tag: 'IMPROVEMENT', text: 'Your pass accuracy drops 12% when you play LW vs CM. Suggest more positional training at left wing.', color: LIME },
                  { tag: 'TREND', text: 'Sprint speed has improved 8.3% over the last 6 matches — consistent with your new interval training load.', color: '#60b8ff' },
                  { tag: 'ACTION', text: 'You\'ve played 3 matches in 8 days. Recommend a recovery session before Saturday to maintain peak output.', color: '#ffba08' },
                ].map(({ tag, text, color }) => (
                  <div key={tag} style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1rem', marginTop: '1rem' }}>
                    <span style={{ ...BC, fontSize: '0.6rem', letterSpacing: '0.14em', color, fontWeight: 700 }}>{tag}</span>
                    <p style={{ ...B, fontSize: '0.8rem', color: DIM, lineHeight: 1.5, marginTop: '0.35rem' }}>{text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PULLQUOTE ─────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p style={{ ...BC, fontSize: 'clamp(2rem,5vw,3.75rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.95, color: CREAM }}>
              "I USED TO GUESS WHERE MY GAME WAS WEAK. NOW I JUST LOOK AT THE DATA."
            </p>
            <div className="flex items-center gap-3 mt-8">
              <div style={{ width: 1, height: 32, background: LIME }} />
              <div>
                <p style={{ ...BC, fontSize: '0.8rem', fontWeight: 700, color: CREAM }}>ALEX RIVERA</p>
                <p style={{ ...B, fontSize: '0.7rem', color: MUTED }}>ECNL Player · Forward · U18</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section style={{ background: GRAY, borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: MUTED }} className="mb-16 uppercase">05 / Process</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-0">
            {[
              { n: '01', t: 'LOG YOUR MATCH', b: 'After every game, spend 60 seconds entering your stats. Goals, assists, rating, position, sprint speed.' },
              { n: '02', t: 'TRACK TRENDS', b: 'Charts update automatically. Watch your season arc build — see what\'s improving, what needs work.' },
              { n: '03', t: 'ELEVATE YOUR GAME', b: 'Use data-driven insights and AI coaching to attack your specific weaknesses before the next kickoff.' },
            ].map(({ n, t, b }, i) => (
              <Reveal key={n} delay={i * 0.08}>
                <div style={{ borderTop: `2px solid ${i === 0 ? LIME : BORDER}`, paddingTop: '2rem', paddingRight: i < 2 ? '3rem' : 0, marginRight: i < 2 ? '3rem' : 0, borderRight: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                  <p style={{ ...BC, fontSize: '3.5rem', fontWeight: 900, color: '#3a3a3a', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>{n}</p>
                  <p style={{ ...BC, fontSize: '1rem', fontWeight: 700, color: CREAM, letterSpacing: '0.04em', marginBottom: '0.75rem' }}>{t}</p>
                  <p style={{ ...B, color: MUTED, fontSize: '0.875rem', lineHeight: 1.65 }}>{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.22em', color: MUTED }} className="mb-4 uppercase">06 / Pricing</p>
            <h2 style={{ ...BC, fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.92, color: CREAM }} className="mb-16">
              START FREE.<br />GO PRO WHEN YOU'RE READY.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {/* Free */}
            <Reveal>
              <div style={{ border: `1px solid ${BORDER}`, padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.18em', color: MUTED, marginBottom: '1rem' }}>FREE</p>
                <div style={{ ...BC, fontSize: '3.5rem', fontWeight: 900, color: CREAM, lineHeight: 1, marginBottom: '0.25rem' }}>$0</div>
                <p style={{ ...B, color: MUTED, fontSize: '0.8rem', marginBottom: '2rem' }}>Always free. No card needed.</p>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {['Unlimited match logging', 'Season stats dashboard', 'Goal tracking', 'Performance charts', 'Demo mode'].map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check size={13} color={LIME}/>
                      <span style={{ ...B, fontSize: '0.85rem', color: DIM }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={signIn} style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: 'transparent', color: CREAM, border: `1px solid ${BORDER}`, padding: '12px', width: '100%' }}
                  className="hover:border-white transition-colors">
                  START FREE
                </button>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal delay={0.08}>
              <div style={{ border: `2px solid ${LIME}`, padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(194,255,0,0.03)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p style={{ ...BC, fontSize: '0.65rem', letterSpacing: '0.18em', color: LIME }}>PRO</p>
                  <span style={{ ...BC, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', background: LIME, color: BLACK, padding: '2px 8px' }}>POPULAR</span>
                </div>
                <div style={{ ...BC, fontSize: '3.5rem', fontWeight: 900, color: CREAM, lineHeight: 1, marginBottom: '0.25rem' }}>$4.99</div>
                <p style={{ ...B, color: MUTED, fontSize: '0.8rem', marginBottom: '2rem' }}>Per month. Cancel anytime.</p>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {['Everything in Free', 'AI Coach analysis', 'Custom training plans', 'Injury tracker', 'Recruit profile page', 'Season archive'].map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check size={13} color={LIME}/>
                      <span style={{ ...B, fontSize: '0.85rem', color: DIM }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={signIn} style={{ ...BC, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', background: LIME, color: BLACK, border: 'none', padding: '13px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  START WITH PRO <ArrowUpRight size={13}/>
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background: LIME }} className="px-6 lg:px-10 py-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-end">
          <Reveal>
            <h2 style={{ ...BC, fontSize: 'clamp(3rem,7vw,5.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.88, color: BLACK }}>
              YOUR NEXT<br />LEVEL STARTS<br />NOW.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ ...B, color: '#2a2a00', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Join hundreds of competitive youth players who track their development with PitchIQ. Free to start — takes 2 minutes to set up.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={signIn} style={{ ...BC, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', background: BLACK, color: LIME, padding: '14px 28px', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GoogleIcon />
                SIGN UP FREE
              </button>
              <button onClick={demo} style={{ ...BC, fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.08em', background: 'transparent', color: BLACK, padding: '14px 28px', border: `1px solid rgba(0,0,0,0.3)` }}
                className="hover:bg-black/10 transition-colors">
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
          <p style={{ ...B, color: '#333', fontSize: '0.75rem' }}>© 2025 PitchIQ · Built for players who want more than highlights.</p>
          <div className="flex gap-5" style={{ ...B, fontSize: '0.75rem', color: MUTED }}>
            <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms</span>
            <button onClick={() => setModal(true)} className="hover:text-white transition-colors">Sign In</button>
          </div>
        </div>
      </footer>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && <Modal onClose={() => setModal(false)} onSignIn={signIn} loading={loading}/>}
      </AnimatePresence>
    </div>
  )
}
