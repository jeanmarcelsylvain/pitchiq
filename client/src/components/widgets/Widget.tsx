/* ═══ Player HQ widget system ════════════════════════════════════════════════
   Modular building blocks for the authenticated app. Every dashboard module
   is a Widget so future features (drag-and-drop, Performance DNA, Team Mode)
   plug in without layout rework. Motion follows the shared token system. */
import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ease } from '@/design/tokens'

/* ── Widget — glass panel with header, optional "view all" link ──────────── */
export function Widget({ title, to, toLabel, badge, children, className = '', tour }: {
  title: string; to?: string; toLabel?: string; badge?: ReactNode
  children: ReactNode; className?: string; tour?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.section
      data-tour={tour}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease }}
      className={`rounded-xl border border-slate-800/80 bg-slate-900/60 shadow-card ${className}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(226,224,240,0.04), 0 4px 24px rgba(4,6,16,0.3)' }}
    >
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{title}</h2>
          {badge}
        </div>
        {to && (
          <Link to={to} className="group flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-pitch-400 transition-colors">
            {toLabel ?? 'View all'}
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        )}
      </header>
      {children}
    </motion.section>
  )
}

/* ── ProgressRing — animated circular progress, replaces flat bars ───────── */
export function ProgressRing({ value, max = 100, size = 64, stroke = 5, color = '#ff5a3c', label, sub }: {
  value: number; max?: number; size?: number; stroke?: number; color?: string
  label?: ReactNode; sub?: string
}) {
  const reduced = useReducedMotion()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, max === 0 ? 0 : value / max)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(37,43,77,0.9)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: reduced ? c * (1 - pct) : c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2, ease }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label}
        {sub && <span className="text-[9px] uppercase tracking-wider text-slate-500">{sub}</span>}
      </div>
    </div>
  )
}

/* ── ActionCard — large premium quick action ─────────────────────────────── */
export function ActionCard({ icon, title, sub, onClick, accent = false, ai = false }: {
  icon: ReactNode; title: string; sub: string; onClick: () => void
  accent?: boolean; ai?: boolean
}) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      onClick={onClick}
      whileHover={reduced ? undefined : { y: -4 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.25, ease }}
      className={`group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left overflow-hidden transition-colors ${
        accent
          ? 'border-pitch-600/40 bg-pitch-600/10 hover:border-pitch-500/60'
          : ai
          ? 'border-blue-500/25 bg-blue-500/[0.06] hover:border-blue-400/50'
          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
      }`}
    >
      {/* soft corner lighting */}
      <div aria-hidden className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        accent ? 'bg-pitch-500/20' : ai ? 'bg-blue-400/15' : 'bg-slate-500/10'
      }`} />
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${
        accent ? 'bg-pitch-600/25 text-pitch-400' : ai ? 'bg-blue-500/15 text-blue-300' : 'bg-slate-800 text-slate-400'
      }`}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-200">{title}</span>
        <span className="block text-[11px] text-slate-500 mt-0.5">{sub}</span>
      </span>
    </motion.button>
  )
}
