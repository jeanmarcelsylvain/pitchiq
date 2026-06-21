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
  green: { icon: 'bg-emerald-500/15 text-emerald-400', glow: 'shadow-emerald-500/5' },
  blue: { icon: 'bg-blue-500/15 text-blue-400', glow: 'shadow-blue-500/5' },
  yellow: { icon: 'bg-yellow-500/15 text-yellow-400', glow: 'shadow-yellow-500/5' },
  red: { icon: 'bg-red-500/15 text-red-400', glow: 'shadow-red-500/5' },
  purple: { icon: 'bg-purple-500/15 text-purple-400', glow: 'shadow-purple-500/5' },
  slate: { icon: 'bg-slate-700/50 text-slate-400', glow: '' },
}

export function StatCard({ label, value, subtext, icon, trend, color = 'green', className }: StatCardProps) {
  const { icon: iconClass } = colorMap[color]

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-700',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
          {trend !== undefined && (
            <div className={cn(
              'mt-2 inline-flex items-center gap-1 text-xs font-medium',
              trend >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend).toFixed(1)}% vs last period</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconClass)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
