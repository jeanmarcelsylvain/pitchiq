import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingUp, Target, Activity, ArrowRight, Shield, BarChart2, LogIn, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Landing() {
  const { enterDemoMode, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  const handleDemo = () => {
    enterDemoMode()
    navigate('/dashboard')
  }

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } finally {
      setSigningIn(false)
      setShowSignInModal(false)
    }
  }

  const features = [
    { icon: Activity, title: 'Match Logging', desc: 'Log every performance metric — goals, assists, pass accuracy, sprint speed, distance covered, and more.' },
    { icon: BarChart2, title: 'Deep Analytics', desc: 'Interactive charts surface trends across your entire season so you know exactly where to improve.' },
    { icon: Zap, title: 'AI Insights', desc: 'Automatically generated insights tell you what the data means — not just what it shows.' },
    { icon: Target, title: 'Goal Tracking', desc: 'Set season targets and track your progress with real-time progress bars and milestone alerts.' },
    { icon: TrendingUp, title: 'Performance Trends', desc: 'Identify patterns across positions, competitions, and training loads to optimize peak performance.' },
    { icon: Shield, title: 'Built for ECNL', desc: 'Metrics aligned with what college scouts and coaches actually evaluate at the elite youth level.' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pitch-600">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-white">MyFutbolPro</span>
              </div>
              <button onClick={() => setShowSignInModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-sm text-slate-400 mb-8">Sign in to pick up right where you left off. All your matches, goals, and progress are saved.</p>

            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              {signingIn ? 'Signing in…' : 'Continue with Google'}
            </button>

            <p className="text-center text-xs text-slate-600 mt-5">
              New to MyFutbolPro?{' '}
              <button onClick={() => setShowSignInModal(false)} className="text-pitch-400 hover:text-pitch-300 underline">
                Create an account
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">MyFutbolPro</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDemo} className="hidden sm:flex">
            Try Demo
          </Button>
          <button
            onClick={() => setShowSignInModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-slate-600 hover:text-white transition-all"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-24 text-center lg:px-12 lg:py-36 overflow-hidden">
        {/* Gradient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-pitch-600/8 blur-3xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-pitch-600/30 bg-pitch-600/10 px-4 py-1.5 text-xs font-medium text-pitch-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-pitch-400 animate-pulse" />
            Built for competitive players aged 14–22
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight">
            Know Your Game.
            <br />
            <span className="text-pitch-400">Elevate Your Play.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            MyFutbolPro is the performance analytics platform for serious youth soccer players.
            Track every match, visualize your trends, and unlock data-driven insights that help you reach the next level.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-all w-full sm:w-auto"
            >
              <GoogleIcon />
              Sign Up with Google
            </button>
            <button
              onClick={() => setShowSignInModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-all w-full sm:w-auto"
            >
              <LogIn className="h-4 w-4" />
              Sign In — Returning User
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button onClick={handleDemo} className="text-xs text-slate-600 hover:text-slate-400 underline transition-colors">
              Explore demo instead
            </button>
            <span className="text-slate-700">·</span>
            <p className="text-xs text-slate-600">Free to start · AI features from $4.99/mo</p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {[
              { value: '2,400+', label: 'Matches Logged' },
              { value: '98%', label: 'Player Retention' },
              { value: '14', label: 'Key Metrics Tracked' },
              { value: '4.9★', label: 'User Rating' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white lg:text-4xl">Everything a serious player needs</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">From match stats to season trends — MyFutbolPro gives you the same analytics infrastructure that pro clubs use.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all duration-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pitch-600/15 text-pitch-400 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-pitch-600/20 bg-pitch-600/5 p-12 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to level up?</h2>
          <p className="mt-4 text-slate-400">Join hundreds of competitive youth players tracking their development with MyFutbolPro.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-all w-full sm:w-auto"
            >
              <GoogleIcon />
              Create Free Account
            </button>
            <button
              onClick={() => setShowSignInModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-transparent px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-all w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-xs text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-3 w-3 text-pitch-600" />
          <span className="font-semibold text-slate-500">MyFutbolPro</span>
        </div>
        <p>© 2024 MyFutbolPro. Built for players who want more than just highlights.</p>
      </footer>
    </div>
  )
}
