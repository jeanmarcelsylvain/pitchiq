/* ═══ Career Message — a single, dismissible line of perspective ══════════
   Large type, generous space, fades in and settles, never demands
   attention. Used sparingly at meaningful moments (see careerMessages.ts). */
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'

export function CareerMessage({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.6, ease }}
          className="relative overflow-hidden rounded-xl px-6 py-8 text-center"
          style={{ background: 'linear-gradient(160deg, rgba(23,28,56,0.85), rgba(10,13,28,0.95))', border: `1px solid ${color.border}` }}
          role="status"
        >
          <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: 'rgba(255,90,60,0.08)' }} />
          <button onClick={onDismiss} aria-label="Dismiss"
            className="absolute right-3 top-3 text-slate-600 hover:text-slate-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
          <p className="relative" style={{ fontFamily: font.display, fontSize: 'clamp(1.1rem,2.4vw,1.5rem)', fontWeight: 600, color: color.ink, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
