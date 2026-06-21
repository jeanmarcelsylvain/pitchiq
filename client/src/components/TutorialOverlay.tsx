import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronLeft } from 'lucide-react'

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
    position: 'bottom',
    title: 'Performance Trend',
    description: 'This chart tracks your match rating over time. Look for upward trends to see when your form is peaking, and dips to identify when you need to refocus.',
  },
  {
    page: '/dashboard',
    selector: '[data-tour="insights"]',
    position: 'left',
    title: 'AI Insights',
    description: 'MyFutbolPro automatically analyzes your data and surfaces personalized insights — like when your passing accuracy drops in away games, or when your goal rate is improving.',
  },
  {
    page: '/matches',
    position: 'center',
    title: 'Match Logging',
    description: "This is where you log every game you play. The more matches you log, the smarter your analytics get. Every stat you enter powers your charts and AI coaching.",
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
    description: 'Deep dive into your performance data. Charts show trends across your entire season so you can see exactly where you are improving and where to focus next.',
  },
  {
    page: '/analytics',
    selector: '[data-tour="radar-chart"]',
    position: 'top',
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

interface Rect { top: number; left: number; width: number; height: number }

interface Props {
  uid: string
  onComplete: () => void
}

export default function TutorialOverlay({ uid, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [highlightRect, setHighlightRect] = useState<Rect | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [prevEl, setPrevEl] = useState<Element | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const PAD = 10

  // Navigate when step requires a different page
  useEffect(() => {
    if (location.pathname !== current.page) {
      navigate(current.page)
    }
  }, [step])

  // Reposition after page change
  useEffect(() => {
    setVisible(false)

    // Restore previous element's z-index
    if (prevEl) {
      ;(prevEl as HTMLElement).style.position = ''
      ;(prevEl as HTMLElement).style.zIndex = ''
      setPrevEl(null)
    }

    const timer = setTimeout(() => {
      position()
      setVisible(true)
    }, 450)

    return () => {
      clearTimeout(timer)
    }
  }, [step, location.pathname])

  const position = () => {
    if (!current.selector) {
      setHighlightRect(null)
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 360,
        zIndex: 10002,
      })
      return
    }

    const el = document.querySelector(current.selector) as HTMLElement | null
    if (!el) {
      setHighlightRect(null)
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 360,
        zIndex: 10002,
      })
      return
    }

    // Lift element above overlay
    el.style.position = 'relative'
    el.style.zIndex = '10001'
    setPrevEl(el)

    const rect = el.getBoundingClientRect()
    setHighlightRect({
      top: rect.top - PAD,
      left: rect.left - PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
    })

    // Position tooltip
    const tipW = 340
    const pos = current.position ?? 'bottom'
    let style: React.CSSProperties = { position: 'fixed', width: tipW, zIndex: 10002 }

    const centerX = Math.max(12, Math.min(rect.left + rect.width / 2 - tipW / 2, window.innerWidth - tipW - 12))

    if (pos === 'bottom') {
      style.top = rect.bottom + PAD + 12
      style.left = centerX
    } else if (pos === 'top') {
      style.bottom = window.innerHeight - rect.top + PAD + 12
      style.left = centerX
    } else if (pos === 'left') {
      style.top = Math.max(12, rect.top + rect.height / 2 - 100)
      style.right = window.innerWidth - rect.left + PAD + 12
    } else if (pos === 'right') {
      style.top = Math.max(12, rect.top + rect.height / 2 - 100)
      style.left = rect.right + PAD + 12
    }

    setTooltipStyle(style)
  }

  const cleanup = () => {
    if (prevEl) {
      ;(prevEl as HTMLElement).style.position = ''
      ;(prevEl as HTMLElement).style.zIndex = ''
    }
  }

  const handleNext = () => {
    cleanup()
    if (isLast) {
      handleComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const handleBack = () => {
    cleanup()
    if (step > 0) setStep(s => s - 1)
  }

  const handleComplete = () => {
    cleanup()
    localStorage.setItem(TOUR_KEY(uid), 'true')
    onComplete()
  }

  return (
    <>
      {/* Full dark overlay */}
      <div
        className="fixed inset-0 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.82)',
          zIndex: 10000,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      />

      {/* Highlight ring around the element */}
      {highlightRect && (
        <div
          style={{
            position: 'fixed',
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            borderRadius: 14,
            zIndex: 10001,
            pointerEvents: 'none',
            opacity: visible ? 1 : 0,
            transition: 'all 0.35s ease, opacity 0.25s ease',
            border: '2px solid #22c55e',
            boxShadow: '0 0 0 4px rgba(34,197,94,0.15), 0 0 24px 4px rgba(34,197,94,0.25)',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={{
          ...tooltipStyle,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5"
      >
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                height: 6,
                width: i === step ? 24 : 6,
                background: i <= step ? '#22c55e' : '#1e293b',
              }}
            />
          ))}
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
          Step {step + 1} of {STEPS.length}
        </p>
        <h3 className="text-base font-bold text-white mb-2">{current.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-5">{current.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-4 py-2 text-sm font-semibold text-white transition-all active:scale-95"
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
