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
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
}

const sizes = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({ value, max = 100, className, color = 'green', size = 'md', showLabel, animated }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-slate-800/80', sizes[size])}>
        <div
          className={cn(
            'rounded-full transition-all duration-700 ease-out',
            colors[color],
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
