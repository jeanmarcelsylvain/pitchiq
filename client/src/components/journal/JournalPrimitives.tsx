/* ═══ Journal Primitives ══════════════════════════════════════════════════
   Shared building blocks for every Match Journal modal (entry flow, edit,
   details, comparison) — one field style, one modal shell, one button,
   so new journal surfaces never reinvent these. */
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { color, font } from '@/design/tokens'

const BC = { fontFamily: font.display }
const B  = { fontFamily: font.ui }

export function fieldStyle(): React.CSSProperties {
  return { fontFamily: font.ui, fontSize: '0.85rem', color: color.ink, background: color.surface, border: `1px solid ${color.border}`, borderRadius: 8, padding: '9px 12px', width: '100%' }
}
export function labelStyle(): React.CSSProperties {
  return { fontFamily: font.ui, fontSize: '0.72rem', color: color.inkMuted, fontWeight: 500, marginBottom: 5, display: 'block' }
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle()}>{label}</label>
      {children}
      {hint && <p style={{ ...B, fontSize: '0.68rem', color: color.warn }} className="mt-1">{hint}</p>}
    </div>
  )
}

export function ModalShell({ children, onClose, maxWidth = '42rem' }: { children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(10,7,18,0.85)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        style={{ background: color.bg, border: `1px solid ${color.border}`, maxWidth }}
        className="w-full max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  )
}

export function ModalHeader({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b px-6 py-4" style={{ borderColor: color.border }}>
      <div className="min-w-0">
        <h2 style={{ ...BC, fontSize: '1.1rem', fontWeight: 700, color: color.ink }}>{title}</h2>
        {subtitle && <p style={{ ...B, fontSize: '0.75rem', color: color.inkMuted }} className="mt-0.5">{subtitle}</p>}
      </div>
      {children}
      <button onClick={onClose} aria-label="Close" style={{ color: color.inkMuted }} className="hover:text-white transition-colors shrink-0 ml-auto">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t px-6 py-4" style={{ borderColor: color.border }}>
      {children}
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, variant = 'accent' }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: 'accent' | 'danger' | 'ghost'
}) {
  const styles = {
    accent: { background: color.accent, color: color.bg },
    danger: { background: color.danger, color: color.bg },
    ghost: { background: 'transparent', color: color.inkMuted, border: `1px solid ${color.border}` },
  }[variant]
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100"
      style={{ ...BC, ...styles }}>
      {children}
    </button>
  )
}

export function SegmentedControl<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex gap-1 rounded-lg p-1" style={{ background: color.surface, border: `1px solid ${color.border}` }}>
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className="flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors"
          style={{ ...BC, background: value === v ? color.accent : 'transparent', color: value === v ? color.bg : color.inkMuted }}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function NumberInput({ value, onChange, max, step = 1 }: { value: number; onChange: (v: number) => void; max?: number; step?: number }) {
  return (
    <input type="number" min={0} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={fieldStyle()} />
  )
}
