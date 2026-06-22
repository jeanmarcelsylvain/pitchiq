import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  accent?: 'green' | 'blue' | 'amber' | 'purple' | 'none'
}

const accentMap = {
  green:  'border-l-2 border-l-pitch-500 pl-[1px]',
  blue:   'border-l-2 border-l-blue-500 pl-[1px]',
  amber:  'border-l-2 border-l-amber-400 pl-[1px]',
  purple: 'border-l-2 border-l-purple-500 pl-[1px]',
  none:   '',
}

export function Card({ children, className, hover, onClick, accent = 'none' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-900/80 shadow-card backdrop-blur-sm',
        accentMap[accent],
        hover && 'cursor-pointer transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 hover:shadow-lg hover:-translate-y-px',
        onClick && 'cursor-pointer',
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
    <h3 className={cn('text-xs font-bold uppercase tracking-[0.12em] text-slate-500', className)}>
      {children}
    </h3>
  )
}
