import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`
}

export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`
}

export function getPositionColor(position: string): string {
  const gk = ['GK']
  const defenders = ['CB', 'LB', 'RB']
  const midfielders = ['CDM', 'CM', 'CAM', 'LM', 'RM']
  const attackers = ['LW', 'RW', 'CF', 'ST']

  if (gk.includes(position)) return 'text-yellow-400 bg-yellow-400/10'
  if (defenders.includes(position)) return 'text-blue-400 bg-blue-400/10'
  if (midfielders.includes(position)) return 'text-green-400 bg-green-400/10'
  if (attackers.includes(position)) return 'text-red-400 bg-red-400/10'
  return 'text-slate-400 bg-slate-400/10'
}

export function getRatingColor(rating: number): string {
  if (rating >= 8) return 'text-emerald-400'
  if (rating >= 6) return 'text-yellow-400'
  if (rating >= 4) return 'text-orange-400'
  return 'text-red-400'
}

export function getResultBadge(result?: string) {
  if (result === 'win') return { label: 'W', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  if (result === 'loss') return { label: 'L', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
  if (result === 'draw') return { label: 'D', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
  return { label: '-', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
}

export function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0
  const recent = data.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, data.length)
  const older = data.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, data.length - 3)
  if (older === 0) return 0
  return ((recent - older) / older) * 100
}

export function generateInsights(matches: import('@/types').Match[]): import('@/types').Insight[] {
  if (matches.length < 3) return []

  const insights: import('@/types').Insight[] = []
  const now = new Date().toISOString()

  const speeds = matches.map(m => m.sprintSpeed).filter(s => s > 0)
  if (speeds.length >= 3) {
    const trend = calculateTrend(speeds)
    if (Math.abs(trend) > 5) {
      insights.push({
        id: crypto.randomUUID(),
        userId: matches[0].userId,
        type: trend > 0 ? 'improvement' : 'warning',
        title: trend > 0 ? 'Sprint Speed Improving' : 'Sprint Speed Declining',
        body: `Your sprint speed has ${trend > 0 ? 'improved' : 'declined'} ${Math.abs(trend).toFixed(0)}% over your last 3 matches.`,
        metric: 'sprintSpeed',
        changePercent: trend,
        generatedAt: now,
        read: false,
      })
    }
  }

  const passAcc = matches.map(m => m.passAccuracy).filter(p => p > 0)
  if (passAcc.length >= 3) {
    const avg = passAcc.reduce((a, b) => a + b, 0) / passAcc.length
    if (avg >= 85) {
      insights.push({
        id: crypto.randomUUID(),
        userId: matches[0].userId,
        type: 'achievement',
        title: 'Elite Pass Accuracy',
        body: `Your average pass accuracy of ${avg.toFixed(0)}% puts you in the top tier for your age group.`,
        metric: 'passAccuracy',
        generatedAt: now,
        read: false,
      })
    }
  }

  const totalMinutes = matches.reduce((sum, m) => sum + m.minutesPlayed, 0)
  if (totalMinutes >= 1000) {
    insights.push({
      id: crypto.randomUUID(),
      userId: matches[0].userId,
      type: 'achievement',
      title: '1,000 Minutes Milestone',
      body: `You've logged over 1,000 minutes of match time. Consistency like this drives long-term development.`,
      metric: 'minutesPlayed',
      generatedAt: now,
      read: false,
    })
  }

  const ratings = matches.map(m => m.rating).filter(r => r > 0)
  if (ratings.length >= 5) {
    const trend = calculateTrend(ratings)
    if (trend > 8) {
      insights.push({
        id: crypto.randomUUID(),
        userId: matches[0].userId,
        type: 'improvement',
        title: 'Performance Rating Rising',
        body: `Your match rating has been trending upward. Your last 3 games averaged ${(ratings.slice(-3).reduce((a, b) => a + b, 0) / 3).toFixed(1)}/10.`,
        metric: 'rating',
        changePercent: trend,
        generatedAt: now,
        read: false,
      })
    }
  }

  return insights
}
