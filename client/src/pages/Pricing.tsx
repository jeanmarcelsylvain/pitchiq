import { Check, Sparkles, Zap } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const FREE_FEATURES = [
  'Dashboard & performance stats',
  'Unlimited match logging',
  'Match Calendar',
  'Analytics & radar charts',
  'Goals tracker',
  'Achievements & badges',
  'Highlight reel editor',
]

const PRO_FEATURES = [
  'Everything in Free',
  'AI Coach — unlimited messages',
  'Weekly Training Plan Generator',
  'Injury Tracker + AI recovery plans',
  'Recruitment Profile & scout share link',
  'Season Archive',
  'Priority support',
]

export default function Pricing() {
  const { isPro, loading, startCheckout, openPortal, customerId } = useSubscription()
  const { user, isDemoMode } = useAuth()
  const navigate = useNavigate()

  const handleProClick = () => {
    if (!user && !isDemoMode) { navigate('/'); return }
    if (isPro && customerId) { openPortal(); return }
    startCheckout()
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-white">Simple Pricing</h1>
        <p className="mt-2 text-slate-500">Start free. Upgrade when you're ready to go Pro.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">

        {/* Free */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Free</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-slate-500 mb-1">/month</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">No credit card required</p>
          </div>

          <ul className="space-y-3 flex-1">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                <Check className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-slate-700 py-2.5 text-center text-sm font-medium text-slate-500">
            Current Plan
          </div>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border border-pitch-600/40 bg-gradient-to-b from-green-600/10 to-slate-900/60 p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="text-xs font-bold bg-pitch-600 text-white px-2.5 py-1 rounded-full">MOST POPULAR</span>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-pitch-600">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-pitch-400">Pro</p>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-extrabold text-white">$4.99</span>
              <span className="text-slate-400 mb-1">/month</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Cancel anytime</p>
          </div>

          <ul className="space-y-3 flex-1">
            {PRO_FEATURES.map((f, i) => (
              <li key={f} className={`flex items-start gap-2.5 text-sm ${i === 0 ? 'text-slate-400' : 'text-slate-200'}`}>
                <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${i === 0 ? 'text-slate-500' : 'text-pitch-500'}`} />
                {f}
              </li>
            ))}
          </ul>

          <button onClick={handleProClick} disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-50 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-pitch-900/30">
            <Sparkles className="h-4 w-4" />
            {loading ? 'Loading…' : isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
          </button>

          {isPro && (
            <p className="mt-3 text-center text-xs text-pitch-400 font-medium">✓ You're on Pro</p>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white text-center">Common Questions</h2>
        {[
          {
            q: 'Can I cancel anytime?',
            a: 'Yes. Cancel from your profile page at any time. You keep Pro access until the end of your billing period.',
          },
          {
            q: 'Is my payment secure?',
            a: 'All payments are processed by Stripe — the same payment system used by Amazon, Google, and millions of other companies. We never see or store your card details.',
          },
          {
            q: 'What happens to my data if I downgrade?',
            a: 'All your match logs, stats, and progress are always saved. You just lose access to AI features until you re-subscribe.',
          },
          {
            q: 'Do you offer discounts for teams?',
            a: 'Team plans are coming soon. Reach out and we can work something out.',
          },
        ].map(({ q, a }) => (
          <div key={q} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm font-semibold text-white mb-1.5">{q}</p>
            <p className="text-sm text-slate-500">{a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
