/* ═══ Scope Selector ══════════════════════════════════════════════════════
   Every trend module on Performance Intel reads through whatever scope is
   selected here — a single season or full career. Keeps the page's visual
   structure untouched while making every calculation career-aware. */
import { color, font } from '@/design/tokens'
import type { SeasonSummary } from '@/hooks/useCareerMatches'

const BC = { fontFamily: font.display }

export type Scope = 'current' | 'career' | string

export function ScopeSelector({ seasons, scope, onChange }: {
  seasons: SeasonSummary[]; scope: Scope; onChange: (s: Scope) => void
}) {
  if (seasons.length <= 1) return null
  const options: { id: Scope; label: string }[] = [
    ...seasons.map(s => ({ id: s.id, label: s.isCurrent ? 'This Season' : s.name })),
    { id: 'career', label: 'Career' },
  ]
  return (
    <div role="tablist" aria-label="Analytics scope" className="inline-flex flex-wrap gap-1 rounded-lg p-1"
      style={{ background: color.surface, border: `1px solid ${color.border}` }}>
      {options.map(o => (
        <button key={o.id} role="tab" aria-selected={scope === o.id} onClick={() => onChange(o.id)}
          className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{
            ...BC,
            background: scope === o.id ? color.accent : 'transparent',
            color: scope === o.id ? color.bg : color.inkMuted,
          }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
