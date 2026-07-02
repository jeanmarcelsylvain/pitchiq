import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import { Loader } from '@/components/Loader'
import ProGate from '@/components/ProGate'
import Landing from '@/pages/Landing'
import TutorialOverlay, { TOUR_KEY } from '@/components/TutorialOverlay'
import { Ambient } from '@/design/Ambient'
import { useState, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'

/* Authenticated pages are code-split — the landing page never ships them
   (or their chart library). Each loads on first navigation. */
const Onboarding      = lazy(() => import('@/pages/Onboarding'))
const Dashboard       = lazy(() => import('@/pages/Dashboard'))
const Matches         = lazy(() => import('@/pages/Matches'))
const Analytics       = lazy(() => import('@/pages/Analytics'))
const Goals           = lazy(() => import('@/pages/Goals'))
const Profile         = lazy(() => import('@/pages/Profile'))
const AICoach         = lazy(() => import('@/pages/AICoach'))
const Achievements    = lazy(() => import('@/pages/Achievements'))
const RecruitProfile  = lazy(() => import('@/pages/RecruitProfile'))
const Highlights      = lazy(() => import('@/pages/Highlights'))
const ScoutView       = lazy(() => import('@/pages/ScoutView'))
const Injuries        = lazy(() => import('@/pages/Injuries'))
const MatchCalendar   = lazy(() => import('@/pages/MatchCalendar'))
const SeasonArchive   = lazy(() => import('@/pages/SeasonArchive'))
const TrainingPlan    = lazy(() => import('@/pages/TrainingPlan'))
const Pricing         = lazy(() => import('@/pages/Pricing'))
const SubscribeSuccess = lazy(() => import('@/pages/SubscribeSuccess'))

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isDemoMode } = useAuth()
  const [showTour, setShowTour] = useState(() => {
    if (typeof window === 'undefined') return false
    const uid = isDemoMode ? 'demo' : user?.uid ?? ''
    if (!uid) return false
    return localStorage.getItem(TOUR_KEY(uid)) !== 'true'
  })

  if (loading) {
    return <Loader />
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
    return <Loader />
  }

  const isAuthed = !!user || isDemoMode
  const isOnboarded = user ? localStorage.getItem(`onboarded_${user.uid}`) === 'true' : true

  return (
    <Suspense fallback={<Loader />}>
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
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Ambient />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
