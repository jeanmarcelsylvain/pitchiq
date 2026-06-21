import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/hooks/useAppData'

interface ScheduledMatch {
  id: string
  date: string
  opponent: string
  competition: string
  venue: 'home' | 'away' | 'neutral'
  kickoffTime: string
  notes: string
}

function SCHED_KEY(uid: string) { return `scheduled_matches_${uid}` }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function MatchCalendar() {
  const { user, isDemoMode } = useAuth()
  const { matches } = useAppData()
  const uid = isDemoMode ? 'demo' : user?.uid ?? ''

  const today = new Date()
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [scheduled, setScheduled] = useState<ScheduledMatch[]>(() => {
    try { return JSON.parse(localStorage.getItem(SCHED_KEY(uid)) ?? '[]') } catch { return [] }
  })
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<ScheduledMatch, 'id'>>({
    date: '', opponent: '', competition: '', venue: 'home', kickoffTime: '15:00', notes: '',
  })

  const saveScheduled = (updated: ScheduledMatch[]) => {
    setScheduled(updated)
    localStorage.setItem(SCHED_KEY(uid), JSON.stringify(updated))
  }

  const addMatch = () => {
    if (!form.opponent || !form.date) return
    const record: ScheduledMatch = { ...form, id: Date.now().toString() }
    saveScheduled([...scheduled, record])
    setShowForm(false)
    setForm({ date: '', opponent: '', competition: '', venue: 'home', kickoffTime: '15:00', notes: '' })
  }

  const deleteScheduled = (id: string) => saveScheduled(scheduled.filter(m => m.id !== id))

  // Build calendar grid
  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay()
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const getDateStr = (day: number) => `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const playedOnDate = (d: string) => matches.filter(m => m.date === d)
  const scheduledOnDate = (d: string) => scheduled.filter(m => m.date === d)

  const prevMonth = () => setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  const nextMonth = () => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })

  const selectedDatePlayed = selectedDate ? playedOnDate(selectedDate) : []
  const selectedDateScheduled = selectedDate ? scheduledOnDate(selectedDate) : []

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Match Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">View past matches and schedule upcoming games</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, date: selectedDate ?? '' })) }}
          className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-all">
          <Plus className="h-4 w-4" /> Schedule Match
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-bold text-white">{MONTHS[viewDate.month]} {viewDate.year}</h2>
            <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-600 py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const dateStr = getDateStr(day)
              const isToday = dateStr === today.toISOString().slice(0, 10)
              const isSelected = dateStr === selectedDate
              const played = playedOnDate(dateStr)
              const sched = scheduledOnDate(dateStr)
              const hasEvents = played.length > 0 || sched.length > 0

              return (
                <button key={i} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative flex flex-col items-center rounded-lg py-2 px-1 transition-all ${
                    isSelected ? 'bg-green-600 text-white' :
                    isToday ? 'bg-green-600/15 border border-green-600/40 text-green-400' :
                    'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}>
                  <span className="text-sm font-medium">{day}</span>
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-1">
                      {played.length > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />}
                      {sched.length > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /><span className="text-xs text-slate-500">Played</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /><span className="text-xs text-slate-500">Scheduled</span></div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {selectedDate ? (
            <>
              <h3 className="text-sm font-semibold text-slate-400">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>

              {selectedDatePlayed.map(m => (
                <div key={m.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">vs {m.opponent}</p>
                      <p className="text-xs text-slate-500">{m.competition} · {m.venue}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      m.result === 'win' ? 'bg-green-600/20 text-green-400' :
                      m.result === 'draw' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-red-600/20 text-red-400'
                    }`}>{m.result === 'win' ? 'W' : m.result === 'draw' ? 'D' : 'L'}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-slate-400">
                    <span>{m.goals}G {m.assists}A</span>
                    <span>{m.rating}/10 rating</span>
                    <span>{m.minutesPlayed}'</span>
                  </div>
                </div>
              ))}

              {selectedDateScheduled.map(m => (
                <div key={m.id} className="rounded-xl border border-blue-600/20 bg-blue-600/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">vs {m.opponent}</p>
                      <p className="text-xs text-slate-500">{m.competition} · {m.venue} · {m.kickoffTime}</p>
                      {m.notes && <p className="text-xs text-slate-600 mt-1">{m.notes}</p>}
                    </div>
                    <button onClick={() => deleteScheduled(m.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="inline-block mt-2 text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Upcoming</span>
                </div>
              ))}

              {selectedDatePlayed.length === 0 && selectedDateScheduled.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
                  <Calendar className="h-6 w-6 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">No matches on this day</p>
                  <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, date: selectedDate })) }}
                    className="mt-3 text-xs text-green-500 hover:text-green-400 transition-colors">
                    + Schedule a match
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <Calendar className="h-6 w-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">Click a date to see match details</p>
            </div>
          )}

          {/* Upcoming matches */}
          {scheduled.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Next Matches</p>
              <div className="space-y-2">
                {scheduled
                  .filter(m => m.date >= today.toISOString().slice(0, 10))
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 5)
                  .map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-white text-xs font-medium">vs {m.opponent}</p>
                        <p className="text-slate-600 text-xs">{new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {m.kickoffTime}</p>
                      </div>
                      <span className="text-xs text-blue-400">{m.venue}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Schedule Match</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {[
              { label: 'Date', type: 'date', key: 'date' },
              { label: 'Opponent', type: 'text', key: 'opponent', placeholder: 'Team name' },
              { label: 'Competition', type: 'text', key: 'competition', placeholder: 'League, cup, friendly...' },
              { label: 'Kickoff time', type: 'time', key: 'kickoffTime' },
            ].map(({ label, type, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                <input type={type} placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-green-500 transition-colors" />
              </div>
            ))}

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Venue</label>
              <div className="flex gap-2">
                {(['home', 'away', 'neutral'] as const).map(v => (
                  <button key={v} onClick={() => setForm(f => ({ ...f, venue: v }))}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium capitalize transition-all ${
                      form.venue === v ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Preparation notes, travel info..."
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-green-500 transition-colors resize-none" />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={addMatch} disabled={!form.opponent || !form.date}
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 py-2.5 text-sm font-semibold text-white transition-all">
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
