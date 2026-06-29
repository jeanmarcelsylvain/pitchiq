import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { LogIn, X, Check, ChevronRight, ArrowRight, BarChart2, Target, Activity, Zap, Shield, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/* ─── Motion helpers ──────────────────────────────────────────────────────── */
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.4 } },
}
const stagger = (delay = 0.08) => ({
  show: { transition: { staggerChildren: delay } },
})

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      variants={stagger()}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/* ─── Assets ──────────────────────────────────────────────────────────────── */
function HexLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,1 29,8 29,24 16,31 3,24 3,8" fill="#00a844" stroke="#00e676" strokeWidth="1"/>
      <polygon points="16,6 24,10.5 24,21.5 16,26 8,21.5 8,10.5" fill="#008535" />
      <circle cx="16" cy="16" r="4" fill="#00e676" opacity="0.9"/>
      <line x1="16" y1="6" x2="16" y2="10" stroke="#00e676" strokeWidth="1" opacity="0.6"/>
      <line x1="24" y1="10.5" x2="20.5" y2="12.5" stroke="#00e676" strokeWidth="1" opacity="0.6"/>
      <line x1="24" y1="21.5" x2="20.5" y2="19.5" stroke="#00e676" strokeWidth="1" opacity="0.6"/>
      <line x1="16" y1="26" x2="16" y2="22" stroke="#00e676" strokeWidth="1" opacity="0.6"/>
      <line x1="8" y1="21.5" x2="11.5" y2="19.5" stroke="#00e676" strokeWidth="1" opacity="0.6"/>
      <line x1="8" y1="10.5" x2="11.5" y2="12.5" stroke="#00e676" strokeWidth="1" opacity="0.6"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

/* ─── Animated counter ────────────────────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1400
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * to))
      if (progress < 1) requestAnimationFrame(tick)
      else setCount(to)
    }
    requestAnimationFrame(tick)
  }, [inView, to])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─── Sign-in modal ───────────────────────────────────────────────────────── */
function SignInModal({ onClose, onSignIn, loading }: { onClose: () => void; onSignIn: () => void; loading: boolean }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-8"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <HexLogo size={28} />
            <span className="font-bold text-white tracking-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', letterSpacing: '0.02em' }}>PITCHIQ</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.02em' }}>WELCOME BACK</h2>
        <p className="text-sm text-slate-500 mb-8" style={{ fontFamily: 'Barlow, sans-serif' }}>Sign in to pick up right where you left off.</p>
        <button
          onClick={onSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ fontFamily: 'Barlow, sans-serif' }}
        >
          <GoogleIcon />
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>
        <p className="text-center text-xs text-slate-600 mt-5" style={{ fontFamily: 'Barlow, sans-serif' }}>
          New to PitchIQ?{' '}
          <button onClick={onClose} className="text-pitch-400 hover:text-pitch-300 underline">Create an account</button>
        </p>
      </motion.div>
    </motion.div>
  )
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function Landing() {
  const { enterDemoMode, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [navSolid, setNavSolid] = useState(false)
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 400], [0, 80])

  useEffect(() => {
    return scrollY.on('change', v => setNavSolid(v > 60))
  }, [scrollY])

  const handleDemo = () => { enterDemoMode(); navigate('/dashboard') }
  const handleSignIn = async () => {
    setSigningIn(true)
    try { await signInWithGoogle() }
    finally { setSigningIn(false); setShowModal(false) }
  }

  const BC = { fontFamily: 'Barlow Condensed, sans-serif' }
  const B  = { fontFamily: 'Barlow, sans-serif' }

  /* Feature rows — alternating layout, NOT a card grid */
  const features = [
    {
      tag: 'MATCH LOGGING',
      headline: 'Every stat. Every game. Nothing missed.',
      body: 'Log 14 performance metrics per match in under 60 seconds — goals, assists, pass accuracy, sprint speed, distance, rating, and more. Your data, structured for analysis.',
      icon: Activity,
      stat: { value: 14, label: 'metrics per match', suffix: '' },
      visual: 'metrics',
    },
    {
      tag: 'TREND ANALYTICS',
      headline: 'See the pattern before the coach does.',
      body: 'Interactive charts surface performance trends across your entire season. Compare positions, identify peak form periods, and know exactly where your game is growing.',
      icon: BarChart2,
      stat: { value: 8, label: 'chart types', suffix: '+' },
      visual: 'chart',
    },
    {
      tag: 'GOAL TRACKING',
      headline: 'Set targets. Chase them. Hit them.',
      body: 'Define measurable season goals — goals scored, pass accuracy, sprint speed — and watch your progress update automatically with every match logged.',
      icon: Target,
      stat: { value: 100, label: 'data-driven', suffix: '%' },
      visual: 'goals',
    },
  ]

  const steps = [
    { n: '01', title: 'LOG YOUR MATCH', body: 'After every game, spend 60 seconds entering your stats. Takes less time than the walk to the car.' },
    { n: '02', title: 'TRACK YOUR TRENDS', body: 'Watch your performance charts build over time. Spot patterns in your form, fitness, and output.' },
    { n: '03', title: 'ELEVATE YOUR GAME', body: 'Use data-driven insights and AI coaching to identify exactly where to improve before the next match.' },
  ]

  const pricingFree = ['Match logging (unlimited)', 'Season stats dashboard', 'Goal tracking', 'Performance charts', 'Demo mode']
  const pricingPro  = ['Everything in Free', 'AI Coach analysis', 'Custom training plans', 'Injury tracker', 'Recruit profile page', 'Season archive']

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#020b14', ...B }}>

      {/* ── Sticky Nav ─────────────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 lg:px-12 transition-all duration-300"
        style={{ background: navSolid ? 'rgba(2,11,20,0.95)' : 'transparent', backdropFilter: navSolid ? 'blur(12px)' : 'none', borderBottom: navSolid ? '1px solid rgba(13,34,64,0.8)' : 'none' }}
      >
        <div className="flex items-center gap-2.5">
          <HexLogo size={30} />
          <span style={{ ...BC, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.06em' }} className="text-white">PITCHIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDemo} className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors" style={B}>
            Try Demo
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-slate-300 hover:border-pitch-600/60 hover:text-white transition-all"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </button>
          <button
            onClick={handleSignIn}
            className="hidden sm:flex items-center gap-2 rounded-lg bg-pitch-600 hover:bg-pitch-500 px-4 py-1.5 text-sm font-semibold text-white transition-all shadow-glow-green-sm hover:shadow-glow-green"
          >
            Start Free
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background: pitch circles */}
        <div className="pointer-events-none absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <circle cx="50%" cy="50%" r="180" fill="none" stroke="#00c853" strokeWidth="1.5"/>
            <circle cx="50%" cy="50%" r="380" fill="none" stroke="#00c853" strokeWidth="1"/>
            <circle cx="50%" cy="50%" r="580" fill="none" stroke="#00c853" strokeWidth="0.5"/>
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00c853" strokeWidth="0.8"/>
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#00c853" strokeWidth="0.8"/>
            <rect x="20%" y="15%" width="60%" height="70%" fill="none" stroke="#00c853" strokeWidth="0.5"/>
          </svg>
          {/* Radial glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[600px] h-[600px] rounded-full bg-pitch-600/8 blur-3xl" />
          </div>
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative max-w-5xl mx-auto pt-24">
          {/* Badge */}
          <motion.div
            variants={fadeIn}
            initial="hidden" animate="show"
            className="inline-flex items-center gap-2 rounded-full border border-pitch-600/30 bg-pitch-600/10 px-4 py-1.5 mb-10"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-pitch-400 animate-pulse" />
            <span className="text-xs font-semibold text-pitch-400 uppercase tracking-widest" style={BC}>
              Built for competitive players · Ages 14–22 · ECNL Ready
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden" animate="show"
            className="text-[clamp(3.5rem,10vw,7.5rem)] font-extrabold leading-[0.92] uppercase text-white mb-6"
            style={{ ...BC, letterSpacing: '-0.01em' }}
          >
            Know<br />
            <span className="text-pitch-400">Your Game.</span><br />
            Elevate<br />
            Your Play.
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            initial="hidden" animate="show"
            className="max-w-xl mx-auto text-lg text-slate-400 leading-relaxed mb-10"
            style={B}
          >
            PitchIQ is the performance analytics platform for serious youth soccer players. Log every match, track every trend, and get the insights that move you forward.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden" animate="show"
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center gap-3 rounded-xl border border-slate-500 bg-white px-7 py-3.5 font-semibold text-slate-900 hover:bg-slate-100 transition-all w-full sm:w-auto text-sm shadow-lg"
            >
              <GoogleIcon />
              Sign Up Free — Google
            </button>
            <button
              onClick={handleDemo}
              className="flex items-center justify-center gap-2 rounded-xl border border-pitch-600/40 bg-pitch-600/10 px-7 py-3.5 font-semibold text-pitch-400 hover:bg-pitch-600/20 transition-all w-full sm:w-auto text-sm"
            >
              Explore Demo
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.p
            variants={fadeIn}
            initial="hidden" animate="show"
            className="mt-4 text-xs text-slate-600"
            style={B}
          >
            Free to start · AI features from $4.99/mo · No credit card required
          </motion.p>

          {/* Mock scoreboard */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: EASE }}
            className="mt-16 mx-auto max-w-2xl grid grid-cols-4 gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-card"
          >
            {[
              { label: 'Goals', val: '18', sub: '+12% ↑', color: 'text-pitch-400' },
              { label: 'Assists', val: '11', sub: '+8% ↑',  color: 'text-blue-400' },
              { label: 'Avg Rating', val: '8.4', sub: 'season',   color: 'text-amber-400' },
              { label: 'Sprint', val: '29.1', sub: 'km/h', color: 'text-purple-400' },
            ].map(({ label, val, sub, color }) => (
              <div key={label} className="text-center py-2">
                <div className={`text-2xl font-bold stat-number ${color}`} style={BC}>{val}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5" style={BC}>{label}</div>
                <div className="text-[10px] text-slate-600 mt-0.5" style={B}>{sub}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-pitch-600/0 via-pitch-600/60 to-pitch-600/0 mx-auto" />
        </motion.div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-800 bg-slate-900/60">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { to: 2400, suffix: '+', label: 'MATCHES LOGGED' },
            { to: 98,   suffix: '%', label: 'PLAYER RETENTION' },
            { to: 14,   suffix: '',  label: 'METRICS TRACKED' },
            { to: 500,  suffix: '+', label: 'ACTIVE PLAYERS' },
          ].map(({ to, suffix, label }) => (
            <div key={label}>
              <div className="text-4xl font-bold text-white stat-number" style={BC}>
                <Counter to={to} suffix={suffix} />
              </div>
              <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest" style={BC}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Alternating features ────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-32">
          {features.map(({ tag, headline, body, icon: Icon, stat, visual }, i) => (
            <Section key={tag} className={`flex flex-col gap-12 lg:flex-row lg:items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              {/* Text */}
              <div className="flex-1 space-y-5">
                <motion.div variants={fadeUp}>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-pitch-500 border border-pitch-600/30 rounded px-2 py-1" style={BC}>{tag}</span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className="text-4xl lg:text-5xl font-bold uppercase leading-tight text-white"
                  style={{ ...BC, letterSpacing: '-0.01em' }}
                >
                  {headline}
                </motion.h2>
                <motion.p variants={fadeUp} className="text-slate-400 text-lg leading-relaxed" style={B}>{body}</motion.p>
                <motion.div variants={fadeUp} className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-pitch-400 stat-number" style={BC}>
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </span>
                  <span className="text-slate-500 text-sm uppercase tracking-widest" style={BC}>{stat.label}</span>
                </motion.div>
              </div>

              {/* Visual block */}
              <motion.div
                variants={{ hidden: { opacity: 0, x: i % 2 === 0 ? 40 : -40 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } } }}
                className="flex-1"
              >
                {visual === 'metrics' && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 rounded-full bg-pitch-400 animate-pulse" />
                      <span className="text-xs text-slate-500 uppercase tracking-widest" style={BC}>Match vs FC Dallas · 2-1 W</span>
                    </div>
                    {[
                      { label: 'Goals', val: '2', color: 'text-pitch-400' },
                      { label: 'Assists', val: '1', color: 'text-blue-400' },
                      { label: 'Pass Accuracy', val: '87%', color: 'text-amber-400' },
                      { label: 'Sprint Speed', val: '28.4 km/h', color: 'text-purple-400' },
                      { label: 'Distance', val: '9.2 km', color: 'text-slate-300' },
                      { label: 'Rating', val: '8.5/10', color: 'text-pitch-400' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                        <span className="text-sm text-slate-500" style={B}>{label}</span>
                        <span className={`text-sm font-bold stat-number ${color}`} style={BC}>{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {visual === 'chart' && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-slate-500 uppercase tracking-widest" style={BC}>Rating Trend — Last 8 Matches</span>
                      <span className="text-xs text-pitch-400 font-bold" style={BC}>↑ 12%</span>
                    </div>
                    <svg viewBox="0 0 280 100" className="w-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00c853" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#00c853" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0,80 L35,65 L70,70 L105,50 L140,55 L175,35 L210,30 L245,20 L280,15 L280,100 L0,100 Z" fill="url(#chartGrad)"/>
                      <path d="M0,80 L35,65 L70,70 L105,50 L140,55 L175,35 L210,30 L245,20 L280,15" fill="none" stroke="#00c853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      {[[0,80],[35,65],[70,70],[105,50],[140,55],[175,35],[210,30],[245,20],[280,15]].map(([x,y], idx) => (
                        <circle key={idx} cx={x} cy={y} r="4" fill="#00c853" />
                      ))}
                    </svg>
                    <div className="flex justify-between mt-2">
                      {['M1','M2','M3','M4','M5','M6','M7','M8'].map(m => (
                        <span key={m} className="text-[9px] text-slate-600" style={BC}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {visual === 'goals' && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-card space-y-5">
                    <span className="text-xs text-slate-500 uppercase tracking-widest" style={BC}>Season Goals — Progress</span>
                    {[
                      { label: 'Goals Scored', pct: 72, color: '#00c853', val: '18/25' },
                      { label: 'Pass Accuracy', pct: 88, color: '#4da6ff', val: '88%' },
                      { label: 'Sprint Speed', pct: 60, color: '#f5b942', val: '29.1 km/h' },
                      { label: 'Training Sessions', pct: 85, color: '#a855f7', val: '34/40' },
                    ].map(({ label, pct, color, val }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-400" style={B}>{label}</span>
                          <span className="font-bold stat-number" style={{ ...BC, color }}>{val}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.2, ease: EASE }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </Section>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="bg-slate-900/60 border-y border-slate-800 py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-16">
            <motion.div variants={fadeUp}>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-pitch-500" style={BC}>The Process</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="mt-3 text-5xl lg:text-6xl font-bold uppercase text-white" style={{ ...BC, letterSpacing: '-0.01em' }}>
              Three steps.<br />Measurable growth.
            </motion.h2>
          </Section>

          <div className="grid md:grid-cols-3 gap-0 md:gap-0 relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-slate-800" />

            {steps.map(({ n, title, body }, i) => (
              <Section key={n}>
                <motion.div
                  variants={fadeUp}
                  custom={i}
                  className="relative flex flex-col items-center md:items-start text-center md:text-left px-8 py-8"
                >
                  <div className="flex items-center justify-center md:justify-start h-16 w-16 rounded-full border border-pitch-600/30 bg-pitch-600/10 mb-6 relative z-10">
                    <span className="text-2xl font-bold text-pitch-400 stat-number" style={BC}>{n}</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase text-white mb-3" style={BC}>{title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm" style={B}>{body}</p>
                </motion.div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote ──────────────────────────────────────────────────────────── */}
      <Section className="py-28 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} className="mb-6">
            <span className="text-4xl text-pitch-600">"</span>
          </motion.div>
          <motion.blockquote
            variants={fadeUp}
            className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-8"
            style={{ ...BC, letterSpacing: '-0.01em' }}
          >
            I USED TO GUESS WHERE MY GAME WAS WEAK. NOW I JUST LOOK AT THE DATA.
          </motion.blockquote>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-pitch-600/20 border border-pitch-600/30 flex items-center justify-center text-pitch-400 font-bold text-sm" style={BC}>AR</div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white" style={BC}>ALEX RIVERA</p>
              <p className="text-xs text-slate-500" style={B}>ECNL Player · Forward · U18</p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section className="bg-slate-900/60 border-y border-slate-800 py-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-14">
            <motion.div variants={fadeUp}>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-pitch-500" style={BC}>Pricing</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="mt-3 text-5xl font-bold uppercase text-white" style={{ ...BC, letterSpacing: '-0.01em' }}>
              Start free.<br />Go pro when you're ready.
            </motion.h2>
          </Section>

          <Section className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free tier */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2" style={BC}>Free</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white" style={BC}>$0</span>
                  <span className="text-slate-500 text-sm" style={B}>/month</span>
                </div>
                <p className="text-sm text-slate-500 mt-2" style={B}>No credit card required. Always free.</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {pricingFree.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300" style={B}>
                    <Check className="h-4 w-4 text-pitch-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSignIn}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-white transition-all"
                style={BC}
              >
                START FOR FREE
              </button>
            </motion.div>

            {/* Pro tier */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-pitch-600/40 bg-pitch-600/5 p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-pitch-500" />
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-pitch-400" style={BC}>Pro</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-pitch-600/20 text-pitch-400 border border-pitch-600/30 px-1.5 py-0.5 rounded" style={BC}>Popular</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white" style={BC}>$4.99</span>
                  <span className="text-slate-500 text-sm" style={B}>/month</span>
                </div>
                <p className="text-sm text-slate-500 mt-2" style={B}>Everything serious players need.</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {pricingPro.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200" style={B}>
                    <Check className="h-4 w-4 text-pitch-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSignIn}
                className="w-full rounded-xl bg-pitch-600 hover:bg-pitch-500 py-3 text-sm font-bold text-white transition-all shadow-glow-green-sm hover:shadow-glow-green"
                style={BC}
              >
                START WITH PRO →
              </button>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[500px] h-[500px] rounded-full bg-pitch-600/8 blur-3xl" />
          </div>
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <circle cx="50%" cy="50%" r="220" fill="none" stroke="#00c853" strokeWidth="1.5"/>
            <circle cx="50%" cy="50%" r="440" fill="none" stroke="#00c853" strokeWidth="0.8"/>
          </svg>
        </div>

        <Section className="relative max-w-3xl mx-auto">
          <motion.h2
            variants={fadeUp}
            className="text-[clamp(3rem,8vw,6rem)] font-extrabold uppercase leading-tight text-white mb-8"
            style={{ ...BC, letterSpacing: '-0.01em' }}
          >
            Your next level<br />
            <span className="text-pitch-400">starts now.</span>
          </motion.h2>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center gap-3 rounded-xl border border-slate-500 bg-white px-8 py-4 font-semibold text-slate-900 hover:bg-slate-100 transition-all text-sm w-full sm:w-auto"
            >
              <GoogleIcon />
              Create Free Account
            </button>
            <button
              onClick={handleDemo}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 font-semibold text-slate-300 hover:border-slate-600 hover:text-white transition-all text-sm w-full sm:w-auto"
            >
              Explore Demo First
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
          <motion.p variants={fadeIn} className="mt-5 text-xs text-slate-600" style={B}>
            Free forever · AI from $4.99/mo · No card required
          </motion.p>
        </Section>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HexLogo size={20} />
            <span className="font-bold text-slate-400 text-sm tracking-tight" style={BC}>PITCHIQ</span>
          </div>
          <p className="text-xs text-slate-600 text-center" style={B}>© 2025 PitchIQ. Built for players who want more than highlights.</p>
          <div className="flex items-center gap-4 text-xs text-slate-600" style={B}>
            <span>Privacy</span>
            <span>Terms</span>
            <button onClick={() => setShowModal(true)} className="hover:text-slate-400 transition-colors">Sign In</button>
          </div>
        </div>
      </footer>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <SignInModal onClose={() => setShowModal(false)} onSignIn={handleSignIn} loading={signingIn} />
        )}
      </AnimatePresence>
    </div>
  )
}
