import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/* Premium card system — layered elevation with an inner top highlight
   (simulated overhead lighting), soft stacked shadows, and a gentle lift
   on hover. `glass` variant uses the shared .glass utility. */

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
  onClick?: () => void
  accent?: 'green' | 'blue' | 'amber' | 'purple' | 'ai' | 'none'
}

const accentMap = {
  green:  'border-l-2 border-l-pitch-500 pl-[1px]',
  blue:   'border-l-2 border-l-blue-500 pl-[1px]',
  amber:  'border-l-2 border-l-amber-400 pl-[1px]',
  purple: 'border-l-2 border-l-purple-500 pl-[1px]',
  ai:     'border-l-2 border-l-ai-500 pl-[1px]',
  none:   '',
}

export function Card({ children, className, hover, glass, onClick, accent = 'none' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-slate-800 shadow-card',
        glass
          ? 'glass'
          : 'bg-slate-900/90 [box-shadow:inset_0_1px_0_rgba(226,224,240,0.04),0_1px_2px_rgba(4,6,16,0.5),0_8px_32px_rgba(4,6,16,0.35)]',
        accentMap[accent],
        (hover || onClick) && cn(
          'cursor-pointer transition-all duration-300 ease-out will-change-transform',
          'hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-float'
        ),
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-3.5 border-b border-slate-800/80', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-display text-xs font-bold uppercase tracking-[0.18em] text-slate-400', className)}>
      {children}
    </h3>
  )
}
