import { useState } from 'react'
import { Plus, CheckCircle2, X, Target, Trophy, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppData } from '@/hooks/useAppData'
import { useAuth } from '@/hooks/useAuth'
import type { Goal } from '@/types'

const categoryConfig = {
  scoring: { label: 'Scoring', color: 'green' as const, bg: 'bg-emerald-500/10 border-emerald-500/20' },
  passing: { label: 'Passing', color: 'blue' as const, bg: 'bg-blue-500/10 border-blue-500/20' },
  fitness: { label: 'Fitness', color: 'yellow' as const, bg: 'bg-yellow-500/10 border-yellow-500/20' },
  minutes: { label: 'Minutes', color: 'purple' as const, bg: 'bg-purple-500/10 border-purple-500/20' },
  training: { label: 'Training', color: 'blue' as const, bg: 'bg-blue-500/10 border-blue-500/20' },
  custom: { label: 'Custom', color: 'green' as const, bg: 'bg-slate-700/30 border-slate-700' },
}

const emptyForm = {
  title: '',
  description: '',
  category: 'scoring' as Goal['category'],
  targetValue: 10,
  currentValue: 0,
  unit: '',
  deadline: '',
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-400 mb-1">{children}</label>
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-pitch-600 focus:outline-none focus:ring-1 focus:ring-pitch-600/50 ${className}`}
    />
  )
}

export default function Goals() {
  const { goals: initialGoals, isDemo } = useAppData()
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const active = goals.filter(g => !g.completed)
  const completed = goals.filter(g => g.completed)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newGoal: Goal = {
      ...form,
      id: crypto.randomUUID(),
      userId: user?.uid ?? 'demo-user',
      completed: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [newGoal, ...goals]
    setGoals(updated)
    if (!isDemo && user) {
      localStorage.setItem(`goals_${user.uid}`, JSON.stringify(updated))
    }
    setForm(emptyForm)
    setShowForm(false)
  }

  const markComplete = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: true } : g))
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals</h1>
          <p className="mt-1 text-sm text-slate-500">{active.length} active · {completed.length} completed</p>
        </div>
        <Button data-tour="add-goal-btn" variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <div className="flex justify-center mb-2"><Target className="h-5 w-5 text-pitch-400" /></div>
          <p className="text-2xl font-bold text-white">{active.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active Goals</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <div className="flex justify-center mb-2"><Trophy className="h-5 w-5 text-yellow-400" /></div>
          <p className="text-2xl font-bold text-white">{completed.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Completed</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <div className="flex justify-center mb-2"><Clock className="h-5 w-5 text-blue-400" /></div>
          <p className="text-2xl font-bold text-white">
            {Math.round(active.reduce((sum, g) => sum + (g.currentValue / g.targetValue) * 100, 0) / Math.max(1, active.length))}%
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg Progress</p>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-base font-semibold text-white">Set New Goal</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label>Goal Title *</Label>
                <Input required placeholder="e.g. Score 15 goals this season" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="Why does this matter to you?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as Goal['category'] }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:border-pitch-600 focus:outline-none"
                  >
                    {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Unit (goals, %, km/h…)</Label>
                  <Input placeholder="goals" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
                </div>
                <div>
                  <Label>Target Value</Label>
                  <Input type="number" min="0" step="any" value={form.targetValue} onChange={e => setForm(p => ({ ...p, targetValue: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Current Value</Label>
                  <Input type="number" min="0" step="any" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Deadline (optional)</Label>
                <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create Goal</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active goals */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">Active Goals</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {active.map(goal => {
            const cfg = categoryConfig[goal.category]
            const pct = Math.min(100, (goal.currentValue / goal.targetValue) * 100)
            const remaining = goal.targetValue - goal.currentValue

            return (
              <Card key={goal.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${cfg.bg}`}>{cfg.label}</Badge>
                        {goal.deadline && (
                          <span className="text-xs text-slate-600">Due {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white">{goal.title}</h3>
                      {goal.description && <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>}
                    </div>
                    <button
                      onClick={() => markComplete(goal.id)}
                      title="Mark complete"
                      className="flex-shrink-0 text-slate-600 hover:text-emerald-400 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  </div>

                  <ProgressBar value={goal.currentValue} max={goal.targetValue} color={cfg.color} size="md" />

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">{goal.currentValue}</span>
                      <span className="text-sm text-slate-500">/ {goal.targetValue} {goal.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-pitch-400">{pct.toFixed(0)}%</span>
                      <p className="text-xs text-slate-600">{remaining > 0 ? `${remaining} ${goal.unit} to go` : 'Target reached!'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">Completed</h2>
          <div className="space-y-2">
            {completed.map(goal => (
              <div key={goal.id} className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-900/30 px-4 py-3 opacity-60">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-300 line-through">{goal.title}</p>
                </div>
                <Badge variant="success">Done</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
