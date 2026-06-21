import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import Landing from '@/pages/Landing'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Matches from '@/pages/Matches'
import Analytics from '@/pages/Analytics'
import Goals from '@/pages/Goals'
import Profile from '@/pages/Profile'
import AICoach from '@/pages/AICoach'
import Achievements from '@/pages/Achievements'
import RecruitProfile from '@/pages/RecruitProfile'
import Highlights from '@/pages/Highlights'
import ScoutView from '@/pages/ScoutView'
import TutorialOverlay, { TOUR_KEY } from '@/components/TutorialOverlay'
import { useState } from 'react'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isDemoMode } = useAuth()
  const [showTour, setShowTour] = useState(() => {
    if (typeof window === 'undefined') return false
    // Show tour for demo mode always on first visit, or new real users
    const uid = isDemoMode ? 'demo' : user?.uid ?? ''
    if (!uid) return false
    return localStorage.getItem(TOUR_KEY(uid)) !== 'true'
  })

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-pitch-500" />
          <p className="text-sm text-slate-500">Loading MyFutbolPro…</p>
        </div>
      </div>
    )
  }

  if (!user && !isDemoMode) return <Navigate to="/" replace />

  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  return (
    <Layout>
      {children}
      {showTour && uid && (
        <TutorialOverlay uid={uid} onComplete={() => setShowTour(false)} />
      )}
    </Layout>
  )
}

function AppRoutes() {
  const { user, loading, isDemoMode } = useAuth()

  // Wait for Firebase to restore session before making routing decisions
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-pitch-500" />
          <p className="text-sm text-slate-500">Loading PitchIQ…</p>
        </div>
      </div>
    )
  }

  const isAuthed = !!user || isDemoMode

  const isOnboarded = user
    ? localStorage.getItem(`onboarded_${user.uid}`) === 'true'
    : true

  return (
    <Routes>
      <Route path="/" element={
        !isAuthed ? <Landing /> :
        !isOnboarded ? <Navigate to="/onboarding" replace /> :
        <Navigate to="/dashboard" replace />
      } />
      <Route path="/onboarding" element={
        !isAuthed ? <Navigate to="/" replace /> : <Onboarding />
      } />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/ai-coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
      <Route path="/recruit" element={<ProtectedRoute><RecruitProfile /></ProtectedRoute>} />
      <Route path="/highlights" element={<ProtectedRoute><Highlights /></ProtectedRoute>} />
      <Route path="/scout/:encoded" element={<ScoutView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
