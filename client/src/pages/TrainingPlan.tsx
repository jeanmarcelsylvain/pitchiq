import { useState, useRef, useEffect } from 'react'
import { Dumbbell, Sparkles, RefreshCw, Calendar, Clock, ChevronDown, ChevronUp, Save, Check, Zap, Moon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/hooks/useAppData'
import { useApi } from '@/hooks/useApi'

const RAILWAY_URL = 'https://pitchiq-production-facc.up.railway.app'

interface DayPlan {
  day: string
  intensity: 'Rest' | 'Low' | 'Medium' | 'High'
  focus: string
  duration: string
  warmUp: string
  mainDrills: string[]
  coolDown: string
  coachNote: string
}

interface WeeklyPlan {
  id: string
  generatedAt: string
  position: string
  focusAreas: string[]
  daysPerWeek: number
  sessionLength: number
  days: DayPlan[]
}

function PLAN_KEY(uid: string) { return `training_plan_v2_${uid}` }

const INTENSITY_STYLES: Record<DayPlan['intensity'], { badge: string; bar: string; icon: React.ReactNode }> = {
  Rest:   { badge: 'text-slate-400 bg-slate-800 border-slate-700', bar: 'bg-slate-600', icon: <Moon className="h-4 w-4 text-slate-400" /> },
  Low:    { badge: 'text-pitch-400 bg-pitch-400/10 border-pitch-400/20', bar: 'bg-pitch-500', icon: <Dumbbell className="h-4 w-4 text-pitch-400" /> },
  Medium: { badge: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', bar: 'bg-yellow-500', icon: <Dumbbell className="h-4 w-4 text-yellow-400" /> },
  High:   { badge: 'text-red-400 bg-red-400/10 border-red-400/20', bar: 'bg-red-500', icon: <Zap className="h-4 w-4 text-red-400" /> },
}

const FOCUS_OPTIONS = [
  'Shooting & Finishing', 'Dribbling & Ball Control', 'Passing & Vision',
  'Speed & Acceleration', 'Strength & Power', '1v1 Defending',
  'Positioning & Movement', 'Heading & Aerial Duels', 'Weak Foot',
  'Set Pieces', 'Fitness & Endurance', 'First Touch',
]

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function parsePlan(text: string): DayPlan[] {
  const blocks = text.match(/\[DAY\]([\s\S]*?)\[\/DAY\]/g) ?? []

  if (blocks.length === 0) {
    // Fallback: try splitting on day names
    return fallbackParse(text)
  }

  return blocks.map(block => {
    const inner = block.replace(/\[DAY\]|\[\/DAY\]/g, '').trim()

    const get = (key: string) => {
      const m = inner.match(new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z]|$)`, 'si'))
      return m?.[1]?.trim() ?? ''
    }

    const mainBlock = inner.match(/Main:\s*([\s\S]*?)(?=\nCoolDown:|$)/i)?.[1] ?? ''
    const drills = mainBlock
      .split('\n')
      .map(l => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(l => l.length > 8)

    const rawIntensity = get('Intensity').toLowerCase()
    const intensity: DayPlan['intensity'] =
      rawIntensity.includes('high') ? 'High' :
      rawIntensity.includes('medium') || rawIntensity.includes('moderate') ? 'Medium' :
      rawIntensity.includes('low') ? 'Low' : 'Rest'

    return {
      day: get('Name') || get('Day'),
      intensity,
      focus: get('Focus'),
      duration: get('Duration'),
      warmUp: get('WarmUp'),
      mainDrills: drills,
      coolDown: get('CoolDown'),
      coachNote: get('CoachNote'),
    }
  }).filter(d => d.day)
}

function fallbackParse(text: string): DayPlan[] {
  const days: DayPlan[] = []
  for (const dayName of DAY_ORDER) {
    const regex = new RegExp(`${dayName}[:\\s*]*([\\s\\S]*?)(?=${DAY_ORDER.filter(d => d !== dayName).join('|')}|$)`, 'i')
    const match = text.match(regex)
    if (!match) continue
    const block = match[1].trim()
    const lines = block.split('\n').filter(l => l.trim())
    const drills = lines
      .filter(l => /^[-•*\d]/.test(l.trim()))
      .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(l => l.length > 8)

    const intensityMatch = block.match(/intensity[:\s]+(rest|low|medium|high)/i)
    const raw = intensityMatch?.[1]?.toLowerCase() ?? ''
    const intensity: DayPlan['intensity'] =
      raw === 'high' ? 'High' : raw === 'medium' ? 'Medium' : raw === 'low' ? 'Low' : 'Rest'

    days.push({
      day: dayName,
      intensity,
      focus: lines[0]?.replace(/^\W+/, '').slice(0, 70) ?? '',
      duration: block.match(/(\d+)\s*min/i)?.[1] ? `${block.match(/(\d+)\s*min/i)![1]} min` : '',
      warmUp: block.match(/warm.up[:\s]+([^\n]+)/i)?.[1] ?? '',
      mainDrills: drills,
      coolDown: block.match(/cool.down[:\s]+([^\n]+)/i)?.[1] ?? '',
      coachNote: block.match(/(?:note|tip|coach)[:\s]+([^\n]+)/i)?.[1] ?? '',
    })
  }
  return days
}

function intensityBarWidth(i: DayPlan['intensity']) {
  return { Rest: '10%', Low: '33%', Medium: '60%', High: '100%' }[i]
}

export default function TrainingPlan() {
  const { user, isDemoMode } = useAuth()
  const { profile, seasonStats, matches } = useAppData()
  const { apiFetch } = useApi()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  const [savedPlan, setSavedPlan] = useState<WeeklyPlan | null>(() => {
    try { return JSON.parse(localStorage.getItem(PLAN_KEY(uid)) ?? 'null') } catch { return null }
  })
  const [generating, setGenerating] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [selectedFocus, setSelectedFocus] = useState<string[]>([])
  const [daysPerWeek, setDaysPerWeek] = useState(5)
  const [sessionLength, setSessionLength] = useState<30 | 45 | 60 | 90>(60)
  const [saved, setSaved] = useState(false)
  const [progress, setProgress] = useState(0)
  const streamRef = useRef<HTMLDivElement>(null)

  const totalGoals = matches.reduce((s, m) => s + m.goals, 0)

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight
  }, [streamText])

  // Fake progress bar while generating
  useEffect(() => {
    if (!generating) { setProgress(0); return }
    setProgress(5)
    const interval = setInterval(() => {
      setProgress(p => p < 85 ? p + Math.random() * 4 : p)
    }, 600)
    return () => clearInterval(interval)
  }, [generating])

  const generatePlan = async () => {
    setGenerating(true)
    setStreamText('')
    setSavedPlan(null)

    try {
      const res = await fetch(`${RAILWAY_URL}/api/training/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: profile?.primaryPosition ?? 'CM',
          daysPerWeek,
          sessionLength,
          focusAreas: selectedFocus,
          avgRating: seasonStats.avgRating,
          avgPass: seasonStats.avgPassAccuracy,
          avgSpeed: seasonStats.avgSprintSpeed,
          goals: totalGoals,
          matchCount: matches.length,
        }),
      })

      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              fullText += parsed.text
              setStreamText(fullText)
            }
          } catch {}
        }
      }

      setProgress(100)
      const days = parsePlan(fullText)
      const plan: WeeklyPlan = {
        id: Date.now().toString(),
        generatedAt: new Date().toISOString(),
        position: profile?.primaryPosition ?? 'CM',
        focusAreas: selectedFocus,
        daysPerWeek,
        sessionLength,
        days,
      }
      setSavedPlan(plan)
      localStorage.setItem(PLAN_KEY(uid), JSON.stringify(plan))
      if (!isDemoMode) {
        apiFetch('/api/training-plans', { method: 'POST', body: JSON.stringify({
          plan: days, rawText: fullText,
          position: plan.position, days: daysPerWeek, duration: sessionLength,
        })}).catch(() => {})
      }
      setStreamText('')
      setExpandedDay(days[0]?.day ?? null)
    } catch (err) {
      setStreamText('Failed to generate plan. Make sure the server is running and try again.')
    } finally {
      setGenerating(false)
    }
  }

  const savePlan = () => {
    if (savedPlan) {
      localStorage.setItem(PLAN_KEY(uid), JSON.stringify(savedPlan))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Plan Generator</h1>
          <p className="mt-1 text-sm text-slate-500">AI-generated 7-day plan tailored to your position, stats, and goals</p>
        </div>
        {savedPlan && (
          <button onClick={savePlan}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-all">
            {saved ? <><Check className="h-4 w-4 text-pitch-400" /> Saved</> : <><Save className="h-4 w-4" /> Save Plan</>}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
        <h2 className="text-sm font-semibold text-white">Customize Your Week</h2>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Training Days Per Week</label>
            <div className="flex gap-1.5">
              {[3, 4, 5, 6, 7].map(d => (
                <button key={d} onClick={() => setDaysPerWeek(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    daysPerWeek === d ? 'bg-pitch-600 text-white shadow-lg shadow-pitch-900/30' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}>{d}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-2 block">Session Length</label>
            <div className="flex gap-1.5">
              {([30, 45, 60, 90] as const).map(l => (
                <button key={l} onClick={() => setSessionLength(l)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    sessionLength === l ? 'bg-pitch-600 text-white shadow-lg shadow-pitch-900/30' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}>{l}m</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-2 block">
            Focus Areas <span className="text-slate-700">(optional — pick up to 3, or leave blank for AI to choose)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map(f => (
              <button key={f} onClick={() => setSelectedFocus(prev =>
                prev.includes(f) ? prev.filter(x => x !== f) : prev.length >= 3 ? prev : [...prev, f]
              )}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedFocus.includes(f)
                    ? 'bg-pitch-600 text-white shadow shadow-pitch-900/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Stats preview */}
        <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-800">
          <div className="text-xs text-slate-600">Your stats used:</div>
          {[
            { label: 'Rating', value: `${seasonStats.avgRating.toFixed(1)}/10` },
            { label: 'Pass Acc', value: `${seasonStats.avgPassAccuracy}%` },
            { label: 'Speed', value: `${seasonStats.avgSprintSpeed}km/h` },
            { label: 'Goals', value: `${totalGoals} in ${matches.length} games` },
          ].map(s => (
            <span key={s.label} className="text-xs text-slate-500">
              <span className="text-slate-600">{s.label}:</span> <span className="text-white">{s.value}</span>
            </span>
          ))}
        </div>

        <button onClick={generatePlan} disabled={generating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-60 py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-pitch-900/20">
          {generating
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Building your plan…</>
            : <><Sparkles className="h-4 w-4" /> Generate 7-Day Training Plan</>
          }
        </button>
      </div>

      {/* Generation progress */}
      {generating && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Coach Marcos is building your plan…</p>
            <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-pitch-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {streamText && (
            <div ref={streamRef} className="max-h-48 overflow-y-auto rounded-xl bg-slate-950 p-3">
              <p className="text-xs text-slate-500 font-mono leading-relaxed whitespace-pre-wrap">{streamText}</p>
            </div>
          )}
        </div>
      )}

      {/* Generated plan */}
      {savedPlan && !generating && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Your 7-Day Plan</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {savedPlan.position} · {savedPlan.sessionLength}min sessions · {savedPlan.daysPerWeek} training days
                {savedPlan.focusAreas.length > 0 && ` · ${savedPlan.focusAreas.slice(0,2).join(', ')}`}
                {' · '}Generated {new Date(savedPlan.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <button onClick={generatePlan} disabled={generating}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
          </div>

          {/* Week overview strip */}
          <div className="grid grid-cols-7 gap-1">
            {DAY_ORDER.map(dayName => {
              const day = savedPlan.days.find(d => d.day.toLowerCase() === dayName.toLowerCase())
              const style = INTENSITY_STYLES[day?.intensity ?? 'Rest']
              return (
                <button key={dayName}
                  onClick={() => setExpandedDay(expandedDay === dayName ? null : dayName)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                    expandedDay === dayName ? 'border-pitch-500/50 bg-pitch-600/10' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}>
                  <span className="text-xs font-semibold text-slate-500">{dayName.slice(0,3)}</span>
                  {style.icon}
                  <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${style.bar}`} style={{ width: intensityBarWidth(day?.intensity ?? 'Rest') }} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Day cards */}
          <div className="space-y-2">
            {DAY_ORDER.map(dayName => {
              const day = savedPlan.days.find(d => d.day.toLowerCase() === dayName.toLowerCase())
              const isExpanded = expandedDay === dayName
              const style = INTENSITY_STYLES[day?.intensity ?? 'Rest']

              return (
                <div key={dayName} className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                  <button className="w-full flex items-center justify-between p-4 text-left"
                    onClick={() => setExpandedDay(isExpanded ? null : dayName)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 flex-shrink-0">
                        {style.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{dayName}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                            {day?.intensity ?? 'Rest'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-64">
                          {day?.focus || (day?.intensity === 'Rest' ? 'Active Recovery / Rest Day' : 'Training Session')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {day?.duration && (
                        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-600">
                          <Clock className="h-3 w-3" /> {day.duration}
                        </div>
                      )}
                      {day?.mainDrills.length ? (
                        <span className="hidden sm:block text-xs text-slate-600">{day.mainDrills.length} drills</span>
                      ) : null}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </button>

                  {isExpanded && day && (
                    <div className="border-t border-slate-800 p-5 space-y-5">
                      {day.warmUp && (
                        <div>
                          <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">🔥 Warm-Up</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{day.warmUp}</p>
                        </div>
                      )}

                      {day.mainDrills.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-pitch-400 uppercase tracking-wider mb-3">⚽ Main Session</p>
                          <div className="space-y-3">
                            {day.mainDrills.map((drill, i) => {
                              // Split "Drill Name — description" for styling
                              const dashIdx = drill.indexOf(' — ')
                              const drillName = dashIdx > -1 ? drill.slice(0, dashIdx) : drill
                              const drillDesc = dashIdx > -1 ? drill.slice(dashIdx + 3) : ''
                              return (
                                <div key={i} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-800/30 p-3">
                                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-pitch-600/20 text-xs font-bold text-pitch-400">{i + 1}</span>
                                  <div>
                                    <p className="text-sm font-semibold text-white">{drillName}</p>
                                    {drillDesc && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{drillDesc}</p>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {day.intensity === 'Rest' && day.mainDrills.length === 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-800/20 p-4 text-center">
                          <p className="text-slate-400 text-sm">Rest day — let your body recover.</p>
                          <p className="text-slate-600 text-xs mt-1">Light walk, foam rolling, or yoga is fine.</p>
                        </div>
                      )}

                      {day.coolDown && (
                        <div>
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">🧊 Cool-Down</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{day.coolDown}</p>
                        </div>
                      )}

                      {day.coachNote && (
                        <div className="rounded-xl border border-pitch-600/20 bg-pitch-600/5 px-4 py-3">
                          <p className="text-xs font-bold text-pitch-400 mb-1">Coach Marcos says:</p>
                          <p className="text-sm text-slate-300 italic">"{day.coachNote}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!savedPlan && !generating && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 mb-4">
            <Calendar className="h-7 w-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No training plan generated yet</p>
          <p className="text-slate-600 text-sm mt-1 mb-5">Customize your week above and hit Generate</p>
          <button onClick={generatePlan}
            className="flex items-center gap-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-5 py-2.5 text-sm font-semibold text-white transition-all">
            <Sparkles className="h-4 w-4" /> Generate My Plan
          </button>
        </div>
      )}
    </div>
  )
}
