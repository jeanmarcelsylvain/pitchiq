import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, Target, Activity, BarChart2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import type { Position } from '@/types'

const positions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST']

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to MyFutbolPro',
    subtitle: 'Your personal soccer performance analytics platform',
  },
  {
    id: 'features',
    title: 'Here\'s what you can do',
    subtitle: 'Everything you need to track your development',
  },
  {
    id: 'profile',
    title: 'Set up your profile',
    subtitle: 'Tell us about yourself so we can personalize your experience',
  },
]

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-pitch-600 focus:outline-none focus:ring-1 focus:ring-pitch-600/50"
      />
    </div>
  )
}

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    club: '',
    primaryPosition: 'CM' as Position,
    dominantFoot: 'right',
  })
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleFinish = () => {
    localStorage.setItem(`onboarded_${user?.uid}`, 'true')
    localStorage.setItem(`profile_${user?.uid}`, JSON.stringify(profile))
    navigate('/dashboard')
  }

  const field = (key: string, value: string) =>
    setProfile(prev => ({ ...prev, [key]: value }))

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-pitch-500' : i < step ? 'w-4 bg-pitch-700' : 'w-4 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="text-center animate-slide-up">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pitch-600">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Welcome to MyFutbolPro</h1>
            <p className="text-slate-400 mb-2 text-lg">
              Hey {user?.displayName?.split(' ')[0] ?? 'there'} 👋
            </p>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
              MyFutbolPro helps competitive soccer players track every match, analyze their performance, and improve with data-driven insights.
            </p>
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-left space-y-3">
              {[
                'Log your match stats in under 60 seconds',
                'See your performance trends over time',
                'Get personalized insights about your game',
                'Set goals and track your progress',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-pitch-400 flex-shrink-0" />
                  <p className="text-sm text-slate-300">{item}</p>
                </div>
              ))}
            </div>
            <Button variant="primary" size="lg" onClick={() => setStep(1)} className="mt-8 w-full">
              Let's get started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 1 — Features tour */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Here's what you can do</h2>
            <p className="text-slate-500 text-center mb-8">Four powerful tools in one place</p>
            <div className="space-y-4">
              {[
                {
                  icon: Activity,
                  color: 'bg-emerald-500/15 text-emerald-400',
                  title: 'Match Logging',
                  desc: 'After every game, log your goals, assists, pass accuracy, sprint speed, and more. Takes less than a minute.',
                },
                {
                  icon: BarChart2,
                  color: 'bg-blue-500/15 text-blue-400',
                  title: 'Analytics',
                  desc: 'See your trends over time. Are you getting faster? Is your pass accuracy improving? The charts tell the story.',
                },
                {
                  icon: Zap,
                  color: 'bg-purple-500/15 text-purple-400',
                  title: 'Performance Insights',
                  desc: 'MyFutbolPro automatically spots patterns in your data — like which position you perform best in.',
                },
                {
                  icon: Target,
                  color: 'bg-yellow-500/15 text-yellow-400',
                  title: 'Goals & Milestones',
                  desc: 'Set targets like "Score 10 goals" or "85% pass accuracy" and watch your progress bar fill up.',
                },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="ghost" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button variant="primary" onClick={() => setStep(2)} className="flex-1">
                Set up my profile <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Profile setup */}
        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Set up your profile</h2>
            <p className="text-slate-500 text-center mb-8">This personalizes your dashboard</p>
            <div className="space-y-4">
              <Input
                label="Your Name"
                placeholder="e.g. Alex Rivera"
                value={profile.name}
                onChange={e => field('name', e.target.value)}
              />
              <Input
                label="Age"
                type="number"
                placeholder="e.g. 17"
                value={profile.age}
                onChange={e => field('age', e.target.value)}
              />
              <Input
                label="Club / Team"
                placeholder="e.g. FC United Academy"
                value={profile.club}
                onChange={e => field('club', e.target.value)}
              />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Primary Position</label>
                <select
                  value={profile.primaryPosition}
                  onChange={e => field('primaryPosition', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:border-pitch-600 focus:outline-none"
                >
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Dominant Foot</label>
                <div className="grid grid-cols-3 gap-2">
                  {['left', 'right', 'both'].map(foot => (
                    <button
                      key={foot}
                      onClick={() => field('dominantFoot', foot)}
                      className={`rounded-lg border py-2 text-sm font-medium capitalize transition-all ${
                        profile.dominantFoot === foot
                          ? 'border-pitch-600/50 bg-pitch-600/20 text-pitch-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {foot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button variant="primary" onClick={handleFinish} className="flex-1">
                Go to my dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-4">You can update this anytime in your profile</p>
          </div>
        )}

      </div>
    </div>
  )
}
