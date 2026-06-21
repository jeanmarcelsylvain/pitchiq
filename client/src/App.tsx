import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import ProGate from '@/components/ProGate'
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
import Injuries from '@/pages/Injuries'
import MatchCalendar from '@/pages/MatchCalendar'
import SeasonArchive from '@/pages/SeasonArchive'
import TrainingPlan from '@/pages/TrainingPlan'
import Pricing from '@/pages/Pricing'
import SubscribeSuccess from '@/pages/SubscribeSuccess'
import TutorialOverlay, { TOUR_KEY } from '@/components/TutorialOverlay'
import { useState } from 'react'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isDemoMode } = useAuth()
  const [showTour, setShowTour] = useState(() => {
    if (typeof window === 'undefined') return false
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

  const isAuthed = !!user || isDemoMode
  const isOnboarded = user ? localStorage.getItem(`onboarded_${user.uid}`) === 'true' : true

  return (
    <Routes>
      <Route path="/" element={
        !isAuthed ? <Landing /> :
        !isOnboarded ? <Navigate to="/onboarding" replace /> :
        <Navigate to="/dashboard" replace />
      } />
      <Route path="/onboarding" element={!isAuthed ? <Navigate to="/" replace /> : <Onboarding />} />

      {/* Free routes */}
      <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/matches"      element={<ProtectedRoute><Matches /></ProtectedRoute>} />
      <Route path="/calendar"     element={<ProtectedRoute><MatchCalendar /></ProtectedRoute>} />
      <Route path="/analytics"    element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/goals"        element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
      <Route path="/highlights"   element={<ProtectedRoute><Highlights /></ProtectedRoute>} />
      <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/pricing"      element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
      <Route path="/seasons"      element={<ProtectedRoute><SeasonArchive /></ProtectedRoute>} />

      {/* Pro-gated routes */}
      <Route path="/ai-coach"  element={<ProtectedRoute><ProGate feature="AI Coach"><AICoach /></ProGate></ProtectedRoute>} />
      <Route path="/training"  element={<ProtectedRoute><ProGate feature="Training Plan Generator"><TrainingPlan /></ProGate></ProtectedRoute>} />
      <Route path="/injuries"  element={<ProtectedRoute><ProGate feature="Injury Tracker"><Injuries /></ProGate></ProtectedRoute>} />
      <Route path="/recruit"   element={<ProtectedRoute><ProGate feature="Recruitment Profile"><RecruitProfile /></ProGate></ProtectedRoute>} />

      {/* Public */}
      <Route path="/subscribe/success" element={<SubscribeSuccess />} />
      <Route path="/scout/:encoded"    element={<ScoutView />} />
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
