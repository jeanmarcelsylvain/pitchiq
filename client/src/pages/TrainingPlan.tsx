import { useState, useRef, useEffect } from 'react'
import { Dumbbell, Sparkles, RefreshCw, Calendar, Clock, ChevronDown, ChevronUp, Save, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/hooks/useAppData'

const RAILWAY_URL = 'https://pitchiq-production-facc.up.railway.app'

interface DayPlan {
  day: string
  focus: string
  duration: string
  intensity: 'Rest' | 'Low' | 'Medium' | 'High'
  warmUp: string
  mainSession: string[]
  coolDown: string
  notes: string
}

interface WeeklyPlan {
  id: string
  generatedAt: string
  position: string
  focusAreas: string[]
  weekGoal: string
  days: DayPlan[]
  rawText: string
}

function PLAN_KEY(uid: string) { return `training_plan_${uid}` }

const INTENSITY_COLORS: Record<DayPlan['intensity'], string> = {
  Rest: 'text-slate-400 bg-slate-400/10',
  Low: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  High: 'text-red-400 bg-red-400/10',
}

const FOCUS_OPTIONS = [
  'Shooting & Finishing', 'Dribbling & Ball Control', 'Passing & Vision',
  'Speed & Acceleration', 'Strength & Power', '1v1 Defending',
  'Positioning & Movement', 'Heading & Aerial Duels', 'Weak Foot',
  'Set Pieces', 'Fitness & Endurance', 'First Touch',
]

function renderLine(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

export default function TrainingPlan() {
  const { user, isDemoMode } = useAuth()
  const { profile, seasonStats, matches } = useAppData()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  const [savedPlan, setSavedPlan] = useState<WeeklyPlan | null>(() => {
    try { return JSON.parse(localStorage.getItem(PLAN_KEY(uid)) ?? 'null') } catch { return null }
  })
  const [generating, setGenerating] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [selectedFocus, setSelectedFocus] = useState<string[]>([])
  const [daysPerWeek, setDaysPerWeek] = useState(5)
  const [sessionLength, setSessionLength] = useState<'30' | '45' | '60' | '90'>('60')
  const [saved, setSaved] = useState(false)
  const streamRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight
  }, [streamText])

  const totalGoals = matches.reduce((s, m) => s + m.goals, 0)
  const avgRating = seasonStats.avgRating
  const avgPass = seasonStats.avgPassAccuracy
  const avgSpeed = seasonStats.avgSprintSpeed

  const generatePlan = async () => {
    setGenerating(true)
    setStreamText('')

    const position = profile?.primaryPosition ?? 'CM'
    const weaknesses = selectedFocus.length > 0
      ? selectedFocus
      : ['Shooting', 'Dribbling', 'Positioning']

    const prompt = `Generate a complete ${daysPerWeek}-day weekly soccer training plan for a ${position} player.

Player stats:
- Avg match rating: ${avgRating.toFixed(1)}/10
- Pass accuracy: ${avgPass}%
- Sprint speed: ${avgSpeed} km/h
- Goals scored this season: ${totalGoals}
- Matches played: ${matches.length}

Focus areas this week: ${weaknesses.join(', ')}
Session length: ${sessionLength} minutes per session

For each training day provide:
- Day name and focus
- Session duration and intensity level (Rest/Low/Medium/High)
- Warm-up (2-3 minutes description)
- Main session (4-6 specific drills with sets/reps/duration)
- Cool-down (1-2 minutes)
- Key coaching point for the day

Include 1-2 rest/recovery days. Make drills solo-trainable at home or in a park. Be specific with rep counts, distances, and timings. Talk like a real coach.`

    try {
      const res = await fetch(`${RAILWAY_URL}/api/coach/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          position: profile?.primaryPosition ?? 'CM',
          weakAreas: weaknesses,
          matchCount: matches.length,
          history: [],
        }),
      })

      if (!res.ok) throw new Error('Server error')
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

      // Parse into structured plan (best-effort)
      const plan: WeeklyPlan = {
        id: Date.now().toString(),
        generatedAt: new Date().toISOString(),
        position,
        focusAreas: weaknesses,
        weekGoal: `Improve ${weaknesses[0] ?? 'overall performance'} through structured daily training`,
        days: parseDays(fullText),
        rawText: fullText,
      }

      setSavedPlan(plan)
      localStorage.setItem(PLAN_KEY(uid), JSON.stringify(plan))
      setStreamText('')
    } catch {
      setStreamText('Failed to generate plan. Make sure the server is running.')
    } finally {
      setGenerating(false)
    }
  }

  function parseDays(text: string): DayPlan[] {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const days: DayPlan[] = []

    for (const name of dayNames) {
      const regex = new RegExp(`${name}[:\\s]([\\s\\S]*?)(?=(?:${dayNames.join('|')})[:\\s]|$)`, 'i')
      const match = text.match(regex)
      if (!match) continue

      const block = match[1].trim()
      const intensityMatch = block.match(/intensity[:\s]+(rest|low|medium|high)/i)
      const intensity = (intensityMatch?.[1]?.charAt(0).toUpperCase() + (intensityMatch?.[1]?.slice(1) ?? '')) as DayPlan['intensity'] ?? 'Medium'
      const durationMatch = block.match(/(\d+)\s*min/i)

      days.push({
        day: name,
        focus: block.split('\n')[0].replace(/^\W+/, '').slice(0, 80),
        duration: durationMatch ? `${durationMatch[1]} min` : sessionLength + ' min',
        intensity: intensityMatch ? intensity : (block.toLowerCase().includes('rest') ? 'Rest' : 'Medium'),
        warmUp: extractSection(block, 'warm'),
        mainSession: extractList(block),
        coolDown: extractSection(block, 'cool'),
        notes: extractSection(block, 'key|coaching|note|tip'),
      })
    }

    // If parsing failed, return placeholder days
    if (days.length === 0) {
      return [{ day: 'Full Plan', focus: 'See below', duration: sessionLength + ' min', intensity: 'Medium', warmUp: '', mainSession: [text], coolDown: '', notes: '' }]
    }
    return days
  }

  function extractSection(text: string, keyword: string): string {
    const regex = new RegExp(`(?:${keyword})[^\\n]*:\\s*([^\\n]+)`, 'i')
    return text.match(regex)?.[1]?.trim() ?? ''
  }

  function extractList(text: string): string[] {
    const lines = text.split('\n').filter(l => /^[-•*\d]/.test(l.trim()))
    return lines.map(l => l.replace(/^[-•*\d.)\s]+/, '').trim()).filter(l => l.length > 5).slice(0, 8)
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
          <p className="mt-1 text-sm text-slate-500">AI-generated weekly training plan tailored to your stats and position</p>
        </div>
        {savedPlan && (
          <button onClick={savePlan}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-all">
            {saved ? <><Check className="h-4 w-4 text-green-400" /> Saved</> : <><Save className="h-4 w-4" /> Save Plan</>}
          </button>
        )}
      </div>

      {/* Generator controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
        <h2 className="text-sm font-semibold text-white">Customize Your Plan</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Training Days Per Week</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7].map(d => (
                <button key={d} onClick={() => setDaysPerWeek(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    daysPerWeek === d ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}>{d}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-2 block">Session Length</label>
            <div className="flex gap-2">
              {(['30', '45', '60', '90'] as const).map(l => (
                <button key={l} onClick={() => setSessionLength(l)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    sessionLength === l ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}>{l}m</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-2 block">Focus Areas (select up to 3, or leave blank for AI to decide)</label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map(f => (
              <button key={f} onClick={() => {
                setSelectedFocus(prev =>
                  prev.includes(f) ? prev.filter(x => x !== f) :
                  prev.length >= 3 ? prev : [...prev, f]
                )
              }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedFocus.includes(f) ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}>{f}</button>
            ))}
          </div>
        </div>

        <button onClick={generatePlan} disabled={generating}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 py-3 text-sm font-semibold text-white transition-all">
          {generating
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating your plan...</>
            : <><Sparkles className="h-4 w-4" /> Generate Weekly Training Plan</>
          }
        </button>
      </div>

      {/* Streaming output */}
      {generating && streamText && (
        <div ref={streamRef} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 max-h-64 overflow-y-auto">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{streamText}</p>
          <div className="mt-2 flex gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="h-2 w-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}

      {/* Generated plan */}
      {savedPlan && !generating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Your Weekly Plan</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generated {new Date(savedPlan.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {savedPlan.position} · {savedPlan.focusAreas.slice(0, 2).join(', ')}
              </p>
            </div>
            <button onClick={generatePlan}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
          </div>

          {savedPlan.weekGoal && (
            <div className="rounded-xl border border-green-600/20 bg-green-600/5 px-4 py-3">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-0.5">Week Goal</p>
              <p className="text-sm text-slate-300">{savedPlan.weekGoal}</p>
            </div>
          )}

          {savedPlan.days.length === 1 && savedPlan.days[0].day === 'Full Plan' ? (
            // Fallback: show raw text nicely
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: renderLine(savedPlan.rawText) }} />
            </div>
          ) : (
            <div className="space-y-2">
              {savedPlan.days.map(day => (
                <div key={day.day} className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                        {day.intensity === 'Rest'
                          ? <span className="text-lg">😴</span>
                          : <Dumbbell className="h-4 w-4 text-green-400" />
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{day.day}</p>
                        <p className="text-xs text-slate-500 truncate max-w-48">{day.focus || 'Training session'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${INTENSITY_COLORS[day.intensity] ?? INTENSITY_COLORS.Medium}`}>
                        {day.intensity}
                      </span>
                      <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" /> {day.duration}
                      </div>
                      {expandedDay === day.day
                        ? <ChevronUp className="h-4 w-4 text-slate-500" />
                        : <ChevronDown className="h-4 w-4 text-slate-500" />
                      }
                    </div>
                  </div>

                  {expandedDay === day.day && (
                    <div className="border-t border-slate-800 p-4 space-y-3">
                      {day.warmUp && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">🔥 Warm-Up</p>
                          <p className="text-sm text-slate-300">{day.warmUp}</p>
                        </div>
                      )}
                      {day.mainSession.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">⚽ Main Session</p>
                          <ul className="space-y-1.5">
                            {day.mainSession.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                                <span dangerouslySetInnerHTML={{ __html: renderLine(item) }} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {day.coolDown && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">🧊 Cool-Down</p>
                          <p className="text-sm text-slate-300">{day.coolDown}</p>
                        </div>
                      )}
                      {day.notes && (
                        <div className="rounded-xl border border-slate-700 bg-slate-800/30 px-3 py-2.5">
                          <p className="text-xs font-semibold text-green-400 mb-1">Coach's Note</p>
                          <p className="text-xs text-slate-400">{day.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!savedPlan && !generating && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 mb-4">
            <Calendar className="h-7 w-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No training plan yet</p>
          <p className="text-slate-600 text-sm mt-1">Customize your preferences above and generate your first plan</p>
        </div>
      )}
    </div>
  )
}
