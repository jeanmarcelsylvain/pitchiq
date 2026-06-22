import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: ReactNode
  trend?: number
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'slate'
  className?: string
}

const colorMap = {
  green:  {
    icon: 'bg-pitch-600/20 text-pitch-400',
    top: 'bg-pitch-500',
    glow: 'shadow-pitch-500/10',
  },
  blue: {
    icon: 'bg-blue-500/15 text-blue-400',
    top: 'bg-blue-500',
    glow: 'shadow-blue-500/10',
  },
  yellow: {
    icon: 'bg-amber-500/15 text-amber-400',
    top: 'bg-amber-400',
    glow: 'shadow-amber-500/10',
  },
  red: {
    icon: 'bg-red-500/15 text-red-400',
    top: 'bg-red-500',
    glow: 'shadow-red-500/10',
  },
  purple: {
    icon: 'bg-purple-500/15 text-purple-400',
    top: 'bg-purple-500',
    glow: 'shadow-purple-500/10',
  },
  slate: {
    icon: 'bg-slate-700/50 text-slate-400',
    top: 'bg-slate-700',
    glow: '',
  },
}

export function StatCard({ label, value, subtext, icon, trend, color = 'green', className }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-card transition-all duration-200 hover:border-slate-700 hover:-translate-y-px',
      className
    )}>
      {/* Top accent line */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px]', c.top)} />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className={cn('mt-2 text-3xl font-bold tracking-tight text-white stat-number')}>{value}</p>
            {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
            {trend !== undefined && (
              <div className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                trend >= 0 ? 'text-pitch-400' : 'text-red-400'
              )}>
                <span>{trend >= 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(trend).toFixed(1)}%</span>
                <span className="text-slate-600 font-normal">vs last period</span>
              </div>
            )}
          </div>
          <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', c.icon)}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}
