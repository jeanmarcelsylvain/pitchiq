import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

/* Premium button system — every state designed: hover, active/pressed,
   focus-visible, loading, disabled. Primary lifts with a glow; all variants
   press down 1px on :active for physical feedback. */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'ai'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
}

const variants = {
  primary: cn(
    'bg-pitch-500 text-slate-950 font-bold border border-pitch-400/40',
    'shadow-glow-green-sm hover:shadow-glow-accent hover:bg-pitch-400 hover:-translate-y-px',
    'active:translate-y-0 active:shadow-none'
  ),
  secondary: cn(
    'bg-slate-800 text-slate-200 border border-slate-700',
    'hover:bg-slate-700 hover:border-slate-600 hover:-translate-y-px',
    'active:translate-y-0'
  ),
  ghost: cn(
    'text-slate-400 border border-transparent',
    'hover:bg-slate-800/60 hover:text-slate-200',
    'active:bg-slate-800'
  ),
  danger: cn(
    'bg-red-600/15 text-red-400 border border-red-600/30',
    'hover:bg-red-600/25 hover:border-red-500/40',
    'active:bg-red-600/30'
  ),
  outline: cn(
    'bg-transparent text-slate-300 border border-slate-700',
    'hover:border-slate-500 hover:text-white hover:bg-slate-800/40',
    'active:bg-slate-800/60'
  ),
  /* Electric blue — reserved for AI features */
  ai: cn(
    'bg-ai-500/15 text-ai-400 border border-ai-500/30',
    'hover:bg-ai-500/25 hover:border-ai-400/50 hover:shadow-glow-ai',
    'active:bg-ai-500/30'
  ),
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export function Button({ variant = 'secondary', size = 'md', children, loading, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium select-none',
        'transition-all duration-200 ease-out will-change-transform',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pitch-500 focus-visible:outline-offset-2',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
