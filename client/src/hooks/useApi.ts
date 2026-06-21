import { useAuth } from './useAuth'
import { auth } from '@/lib/firebase'

const RAILWAY_URL = 'https://pitchiq-production-facc.up.railway.app'

export function useApi() {
  const { user, isDemoMode } = useAuth()

  async function getToken(): Promise<string | null> {
    if (isDemoMode || !user) return null
    try {
      const token = await auth.currentUser?.getIdToken() ?? null
      if (!token) console.warn('useApi: no token — currentUser:', auth.currentUser?.uid)
      return token
    } catch (err) {
      console.error('useApi: getIdToken failed', err)
      return null
    }
  }

  async function apiFetch<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    const token = await getToken()
    if (!token) {
      console.warn('useApi: skipping request, no token', path)
      return null
    }

    const res = await fetch(`${RAILWAY_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    })

    if (res.status === 204) return null
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error ?? 'API error')
    }
    return res.json() as Promise<T>
  }

  return { apiFetch, isDemoMode, user }
}
