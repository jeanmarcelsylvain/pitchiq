import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

const colors = {
  green:  { fill: 'bg-pitch-500', glow: 'progress-glow' },
  blue:   { fill: 'bg-blue-500',  glow: 'progress-glow-blue' },
  yellow: { fill: 'bg-amber-400', glow: 'progress-glow-amber' },
  red:    { fill: 'bg-red-500',   glow: '' },
  purple: { fill: 'bg-purple-500', glow: '' },
}

const sizes = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
}

export function ProgressBar({ value, max = 100, className, color = 'green', size = 'md', showLabel, animated }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const c = colors[color]

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-slate-800/90', sizes[size])}>
        <div
          className={cn(
            'rounded-full transition-all duration-700 ease-out',
            c.fill,
            c.glow,
            sizes[size],
            animated && 'animate-pulse-slow'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-xs text-slate-500">{Math.round(percent)}%</p>
      )}
    </div>
  )
}
