import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isDemoMode: boolean
  signInWithGoogle: () => Promise<void>
  enterDemoMode: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Google sign-in failed:', err)
    }
  }

  const enterDemoMode = () => {
    setIsDemoMode(true)
    setLoading(false)
  }

  const signOut = async () => {
    setIsDemoMode(false)
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, signInWithGoogle, enterDemoMode, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
