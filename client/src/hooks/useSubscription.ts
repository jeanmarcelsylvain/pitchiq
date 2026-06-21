import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

const RAILWAY_URL = 'https://pitchiq-production-facc.up.railway.app'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface SubCache {
  isPro: boolean
  customerId: string | null
  checkedAt: number
}

function cacheKey(uid: string) { return `sub_cache_${uid}` }

function readCache(uid: string): SubCache | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    if (!raw) return null
    const parsed: SubCache = JSON.parse(raw)
    if (Date.now() - parsed.checkedAt > CACHE_TTL) return null
    return parsed
  } catch { return null }
}

function writeCache(uid: string, data: SubCache) {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify(data)) } catch {}
}

export function clearSubCache(uid: string) {
  try { localStorage.removeItem(cacheKey(uid)) } catch {}
}

export function setSubActive(uid: string, customerId: string) {
  writeCache(uid, { isPro: true, customerId, checkedAt: Date.now() })
}

export function useSubscription() {
  const { user, isDemoMode } = useAuth()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  const [isPro, setIsPro] = useState<boolean>(() => {
    if (isDemoMode) return false // demo users must upgrade to access Pro features
    const cached = uid ? readCache(uid) : null
    return cached?.isPro ?? false
  })
  const [customerId, setCustomerId] = useState<string | null>(() => {
    const cached = uid ? readCache(uid) : null
    return cached?.customerId ?? null
  })
  const [loading, setLoading] = useState(!isDemoMode && !!uid && !readCache(uid))

  useEffect(() => {
    if (isDemoMode) { setIsPro(false); setLoading(false); return }
    if (!uid) { setLoading(false); return }

    const cached = readCache(uid)
    if (cached) {
      setIsPro(cached.isPro)
      setCustomerId(cached.customerId)
      setLoading(false)
      return
    }

    // No cache — check if we have a stored customerId to verify against Stripe
    const storedCustomerId = localStorage.getItem(`stripe_customer_${uid}`)
    if (!storedCustomerId) { setLoading(false); return }

    fetch(`${RAILWAY_URL}/api/subscription/status?customerId=${storedCustomerId}`)
      .then(r => r.json())
      .then(data => {
        const active = data.active === true
        setIsPro(active)
        setCustomerId(storedCustomerId)
        writeCache(uid, { isPro: active, customerId: storedCustomerId, checkedAt: Date.now() })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [uid, isDemoMode])

  const startCheckout = async () => {
    if (isDemoMode) {
      alert('Sign in with your Google account to subscribe to Pro.')
      return
    }
    if (!user?.email || !uid) {
      alert('Please sign in with a Google account to subscribe.')
      return
    }
    try {
      const res = await fetch(`${RAILWAY_URL}/api/subscription/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          email: user.email,
          returnUrl: window.location.origin,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(`Checkout error: ${data.error ?? 'No URL returned. Check Railway has STRIPE_SECRET_KEY and STRIPE_PRICE_ID set.'}`)
      }
    } catch (err) {
      alert(`Could not reach server. Make sure Railway is deployed and running.\n\n${err}`)
    }
  }

  const openPortal = async () => {
    if (!customerId) return
    try {
      const res = await fetch(`${RAILWAY_URL}/api/subscription/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, returnUrl: window.location.origin + '/profile' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Could not open billing portal. Please try again.')
    }
  }

  return { isPro, loading, customerId, startCheckout, openPortal }
}
