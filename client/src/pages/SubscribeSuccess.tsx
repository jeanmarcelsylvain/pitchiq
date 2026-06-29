import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Sparkles, ArrowRight, Loader } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { setSubActive } from '@/hooks/useSubscription'

const RAILWAY_URL = 'https://pitchiq-production-facc.up.railway.app'

export default function SubscribeSuccess() {
  const [searchParams] = useSearchParams()
  const { user, isDemoMode, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (authLoading) return
    if (!sessionId || !uid) { setStatus('error'); return }

    fetch(`${RAILWAY_URL}/api/subscription/verify?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.active && data.customerId) {
          localStorage.setItem(`stripe_customer_${uid}`, data.customerId)
          setSubActive(uid, data.customerId)
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [sessionId, uid, authLoading])

  if (status === 'loading') return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <Loader className="h-8 w-8 animate-spin text-pitch-500 mx-auto" />
        <p className="text-slate-400 text-sm">Activating your Pro account…</p>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-white font-bold text-lg">Something went wrong</p>
        <p className="text-slate-500 text-sm">We couldn't verify your subscription. If you were charged, please contact support — your payment is safe.</p>
        <button onClick={() => navigate('/dashboard')}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-6 py-2.5 text-sm font-medium text-white transition-all">
          Go to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success animation */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pitch-600/20 border-2 border-pitch-500/40 mx-auto">
          <CheckCircle className="h-10 w-10 text-pitch-400" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white">You're now Pro!</h1>
          <p className="text-slate-400 mt-2">Welcome to MyFutbolPro Pro. All AI features are now unlocked.</p>
        </div>

        {/* What's unlocked */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Now unlocked</p>
          {[
            { icon: '🤖', label: 'AI Coach — unlimited sessions' },
            { icon: '📅', label: 'Training Plan Generator' },
            { icon: '🏥', label: 'AI Injury Assessment & Recovery' },
            { icon: '📄', label: 'Recruitment Profile & scout sharing' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <span className="text-sm text-slate-300">{label}</span>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/ai-coach')}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-pitch-900/30">
          <Sparkles className="h-4 w-4" />
          Start with AI Coach
          <ArrowRight className="h-4 w-4" />
        </button>

        <button onClick={() => navigate('/dashboard')}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          Go to dashboard
        </button>
      </div>
    </div>
  )
}
