/* Layout primitives — every marketing/editorial section composes from these
   so gutters, max-widths, and vertical rhythm are identical everywhere. */
import type { ReactNode, CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { color, space, type } from './tokens'

export function Container({ children, className = '', wide = false }: {
  children: ReactNode; className?: string; wide?: boolean
}) {
  return (
    <div className={cn(wide ? 'max-w-7xl' : 'max-w-6xl', 'mx-auto w-full', className)}>
      {children}
    </div>
  )
}

export function Section({ children, className = '', tone = 'base', style }: {
  children: ReactNode; className?: string; tone?: 'base' | 'raised' | 'accent'; style?: CSSProperties
}) {
  const bg = tone === 'raised' ? color.surface : tone === 'accent' ? color.accent : 'transparent'
  return (
    <section
      className={cn('px-6 lg:px-10', className)}
      style={{
        paddingTop: space.sectionY,
        paddingBottom: space.sectionY,
        background: bg,
        borderBottom: tone !== 'accent' ? `1px solid ${color.border}` : 'none',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

/** "01 / The Platform" style eyebrow label */
export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('uppercase', className)} style={{ ...type.label, color: color.inkMuted }}>
      {children}
    </p>
  )
}
