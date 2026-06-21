import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronLeft, X } from 'lucide-react'

interface TutorialStep {
  page: string
  title: string
  description: string
  emoji: string
}

const STEPS: TutorialStep[] = [
  {
    page: '/dashboard',
    emoji: '🏠',
    title: 'Welcome to MyFutbolPro',
    description: "Your home base. See your season stats, recent match ratings, active goals, and AI-generated insights about your performance — all in one place.",
  },
  {
    page: '/matches',
    emoji: '⚽',
    title: 'Log Your Matches',
    description: "After every game, log your stats — goals, assists, pass accuracy, rating, and more. Takes 60 seconds and powers everything else in the app.",
  },
  {
    page: '/analytics',
    emoji: '📊',
    title: 'Analytics',
    description: "Deep dive into your performance data. Charts show trends across your season so you can see exactly where you're improving and where to focus next.",
  },
  {
    page: '/goals',
    emoji: '🎯',
    title: 'Goal Tracking',
    description: 'Set targets for your season and track your progress. Goals keep you accountable — like scoring 10 goals or reaching 80% pass accuracy.',
  },
  {
    page: '/calendar',
    emoji: '📅',
    title: 'Match Calendar',
    description: 'Schedule upcoming games and see your full match history on a calendar. Green dots are played matches, blue are scheduled.',
  },
  {
    page: '/ai-coach',
    emoji: '🤖',
    title: 'AI Performance Coach',
    description: "Your personal AI coach powered by Claude AI. Ask it anything about your game, get drills, and receive personalized feedback based on your stats. Pro feature.",
  },
  {
    page: '/training',
    emoji: '🏋️',
    title: 'Training Plan Generator',
    description: "Get a full week training plan built specifically for your position, stats, and weaknesses. New plan every week. Pro feature.",
  },
  {
    page: '/injuries',
    emoji: '🏥',
    title: 'Injury Tracker',
    description: "Log injuries and chat with Dr. Reid — an AI sports medicine assistant. Get a personalized recovery plan with exercises and prevention tips. Pro feature.",
  },
  {
    page: '/recruit',
    emoji: '📄',
    title: 'Recruitment Profile',
    description: "Build a professional profile to share with coaches and scouts. Includes your stats, highlights, and a shareable link. Pro feature.",
  },
  {
    page: '/dashboard',
    emoji: '🚀',
    title: "You're all set!",
    description: "Start by logging your first match, set a season goal, and explore your AI tools. MyFutbolPro gets smarter the more you use it. Let's go!",
  },
]

export const TOUR_KEY = (uid: string) => `tour_completed_${uid}`

interface Props {
  uid: string
  onComplete: () => void
}

export default function TutorialOverlay({ uid, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Navigate to the correct page for this step
  useEffect(() => {
    if (location.pathname !== current.page) {
      navigate(current.page)
    }
  }, [step])

  const advance = useCallback((nextStep: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setStep(nextStep)
      setAnimating(false)
    }, 200)
  }, [animating])

  const handleNext = () => {
    if (animating) return
    if (isLast) {
      handleComplete()
    } else {
      advance(step + 1)
    }
  }

  const handleBack = () => {
    if (animating || step === 0) return
    advance(step - 1)
  }

  const handleComplete = () => {
    localStorage.setItem(TOUR_KEY(uid), 'true')
    onComplete()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}
        onClick={handleComplete}
      />

      {/* Card — centered, responsive */}
      <div
        className="fixed z-[10000] left-1/2 top-1/2"
        style={{ transform: 'translate(-50%, -50%)', width: 'min(92vw, 420px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? 'scale(0.97)' : 'scale(1)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-slate-800">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-6">
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-2xl flex-shrink-0">
                  {current.emoji}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    {step + 1} / {STEPS.length}
                  </p>
                  <h3 className="text-base font-bold text-white leading-tight">{current.title}</h3>
                </div>
              </div>
              <button
                onClick={handleComplete}
                className="text-slate-600 hover:text-slate-400 transition-colors p-1 flex-shrink-0"
                aria-label="Skip tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-6">{current.description}</p>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    height: 5,
                    width: i === step ? 20 : 5,
                    background: i < step ? '#22c55e' : i === step ? '#4ade80' : '#1e293b',
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 active:scale-95 px-4 py-2.5 text-sm font-semibold text-white transition-all"
              >
                {isLast ? "Let's go!" : 'Next'}
                {!isLast && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

            {!isLast && (
              <button
                onClick={handleComplete}
                className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors mt-3 py-1"
              >
                Skip tour
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
