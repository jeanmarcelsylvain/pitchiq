import { Sparkles, Lock, Loader } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { useState } from 'react'
import type { ReactNode } from 'react'

interface ProGateProps {
  children: ReactNode
  feature?: string
}

export default function ProGate({ children, feature = 'This feature' }: ProGateProps) {
  const { isPro, loading, startCheckout } = useSubscription()
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    await startCheckout()
    setCheckoutLoading(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-pitch-500" />
      </div>
    )
  }

  if (isPro) return <>{children}</>

  return (
    <div className="relative min-h-96">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40 overflow-hidden max-h-80">
        {children}
      </div>

      {/* Paywall overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="mx-auto max-w-sm w-full rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-sm p-8 text-center shadow-2xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pitch-600/20 border border-pitch-600/30 mx-auto mb-4">
            <Lock className="h-6 w-6 text-pitch-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Pro Feature</h2>
          <p className="text-sm text-slate-400 mb-6">
            {feature} is available on MyFutbolPro Pro. Upgrade to unlock AI coaching, training plans, injury assessment, and recruitment tools.
          </p>
          <button onClick={handleUpgrade} disabled={checkoutLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-70 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-pitch-900/30 mb-3">
            {checkoutLoading
              ? <><Loader className="h-4 w-4 animate-spin" /> Redirecting to checkout…</>
              : <><Sparkles className="h-4 w-4" /> Upgrade to Pro — $4.99/mo</>
            }
          </button>
          <p className="text-xs text-slate-600">Cancel anytime · Secure payment via Stripe</p>
        </div>
      </div>
    </div>
  )
}
