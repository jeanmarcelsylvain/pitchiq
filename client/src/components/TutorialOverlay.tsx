import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, ArrowRight, ChevronLeft } from 'lucide-react'

interface TutorialStep {
  page: string
  selector?: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const STEPS: TutorialStep[] = [
  {
    page: '/dashboard',
    position: 'center',
    title: 'Welcome to MyFutbolPro',
    description: "This is your Dashboard — your home base. At a glance you can see your season stats, recent match ratings, active goals, and AI-generated insights about your performance.",
  },
  {
    page: '/dashboard',
    selector: '[data-tour="stat-cards"]',
    position: 'bottom',
    title: 'Season Stats',
    description: 'These cards show your key numbers for the season — goals, assists, pass accuracy, and sprint speed. They update automatically every time you log a match.',
  },
  {
    page: '/dashboard',
    selector: '[data-tour="rating-chart"]',
    position: 'top',
    title: 'Performance Trend',
    description: 'This chart tracks your match rating over time. Look for upward trends to see when your form is peaking, and dips to identify when you need to refocus.',
  },
  {
    page: '/dashboard',
    selector: '[data-tour="insights"]',
    position: 'top',
    title: 'AI Insights',
    description: 'MyFutbolPro automatically analyzes your data and surfaces personalized insights — like when your passing accuracy drops in away games, or when your goal rate is improving.',
  },
  {
    page: '/matches',
    position: 'center',
    title: 'Match Logging',
    description: "This is where you log every game you play. The more matches you log, the smarter your analytics get. Click 'Log Match' to add your first game.",
  },
  {
    page: '/matches',
    selector: '[data-tour="log-match-btn"]',
    position: 'bottom',
    title: 'Log a Match',
    description: "After every game, hit this button and fill in your stats — goals, assists, pass accuracy, rating, and more. It takes about 60 seconds and gives you data you can actually use.",
  },
  {
    page: '/analytics',
    position: 'center',
    title: 'Analytics',
    description: 'Deep dive into your performance data. Charts and graphs show trends across your entire season so you can see exactly where you are improving and where to focus next.',
  },
  {
    page: '/analytics',
    selector: '[data-tour="radar-chart"]',
    position: 'right',
    title: 'Skills Radar',
    description: 'This radar chart shows your strengths and weaknesses across key attributes — finishing, passing, pace, defending, and more. The bigger the shape, the more well-rounded you are.',
  },
  {
    page: '/goals',
    position: 'center',
    title: 'Goal Tracking',
    description: 'Set targets for your season and track your progress. Goals keep you accountable and give you something concrete to work toward — like scoring 10 goals or reaching 80% pass accuracy.',
  },
  {
    page: '/goals',
    selector: '[data-tour="add-goal-btn"]',
    position: 'bottom',
    title: 'Set a Goal',
    description: "Click here to set a new season target. You can track goals scored, assists, pass accuracy, fitness milestones — anything that matters to your development.",
  },
  {
    page: '/ai-coach',
    position: 'center',
    title: 'AI Performance Coach',
    description: "This is your personal AI coach — powered by Claude AI. It asks you position-specific questions, builds a custom weekly training plan with videos, and answers any question you have about your game.",
  },
  {
    page: '/ai-coach',
    position: 'center',
    title: "You're all set!",
    description: "That's the full tour. Start by logging your first match, set a season goal, and let the AI coach build your training plan. MyFutbolPro gets smarter the more you use it. Let's go!",
  },
]

const TOUR_KEY = (uid: string) => `tour_completed_${uid}`

interface Props {
  uid: string
  onComplete: () => void
}

export default function TutorialOverlay({ uid, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({})
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const tooltipRef = useRef<HTMLDivElement>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Navigate to the right page when step changes
  useEffect(() => {
    if (location.pathname !== current.page) {
      navigate(current.page)
    }
  }, [step])

  // Position tooltip after navigation + small delay for render
  useEffect(() => {
    setVisible(false)
    const timer = setTimeout(() => {
      positionTooltip()
      setVisible(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [step, location.pathname])

  const positionTooltip = () => {
    if (!current.selector) {
      // Center of screen
      setSpotlightStyle({ display: 'none' })
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        width: '340px',
      })
      return
    }

    const el = document.querySelector(current.selector)
    if (!el) {
      setSpotlightStyle({ display: 'none' })
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        width: '340px',
      })
      return
    }

    const rect = el.getBoundingClientRect()
    const pad = 8

    // Spotlight
    setSpotlightStyle({
      position: 'fixed',
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: 12,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
      zIndex: 9999,
      pointerEvents: 'none',
      transition: 'all 0.3s ease',
    })

    // Tooltip position
    const pos = current.position ?? 'bottom'
    const tipW = 320
    let style: React.CSSProperties = { position: 'fixed', zIndex: 10001, width: tipW }

    if (pos === 'bottom') {
      style.top = rect.bottom + 16
      style.left = Math.max(12, Math.min(rect.left + rect.width / 2 - tipW / 2, window.innerWidth - tipW - 12))
    } else if (pos === 'top') {
      style.bottom = window.innerHeight - rect.top + 16
      style.left = Math.max(12, Math.min(rect.left + rect.width / 2 - tipW / 2, window.innerWidth - tipW - 12))
    } else if (pos === 'right') {
      style.top = rect.top + rect.height / 2 - 80
      style.left = rect.right + 16
    } else if (pos === 'left') {
      style.top = rect.top + rect.height / 2 - 80
      style.right = window.innerWidth - rect.left + 16
    }

    setTooltipStyle(style)
  }

  const handleNext = () => {
    if (isLast) {
      handleComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleComplete = () => {
    localStorage.setItem(TOUR_KEY(uid), 'true')
    onComplete()
  }

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/75 z-[9998] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Spotlight cutout */}
      {current.selector && (
        <div style={spotlightStyle} />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{ ...tooltipStyle, opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5"
      >
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-pitch-500' : i < step ? 'w-1.5 bg-pitch-500/40' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <h3 className="text-base font-bold text-white mb-2">{current.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-5">{current.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            <button
              onClick={handleComplete}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Skip tour
            </button>
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-4 py-2 text-sm font-semibold text-white transition-all"
          >
            {isLast ? 'Get started' : 'Next'}
            {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </>
  )
}

export { TOUR_KEY }
