/* ═══ 404 — Not Found ═════════════════════════════════════════════════════
   A dead route shouldn't feel like leaving the product. Same lighting,
   same typography, one clear way back — not a blank page or a silent
   redirect. */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { color, font, ease } from '@/design/tokens'
import { useAuth } from '@/hooks/useAuth'

const BC = { fontFamily: font.display }
const B = { fontFamily: font.ui }

export default function NotFound() {
  const { user, isDemoMode } = useAuth()
  const isAuthed = !!user || isDemoMode

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: color.bg }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        className="text-center max-w-sm">
        <p style={{ ...BC, fontSize: '4rem', fontWeight: 900, color: color.accentSoft, lineHeight: 1 }}>404</p>
        <h1 className="mt-3 font-display text-xl font-extrabold text-white">This page went off the pitch.</h1>
        <p className="mt-2 text-sm" style={{ ...B, color: color.inkMuted }}>
          The link you followed doesn't match anything in PitchIQ. It may have moved, or the URL is off.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ ...BC, background: color.surface, color: color.inkDim, border: `1px solid ${color.border}` }}>
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
          <Link to={isAuthed ? '/dashboard' : '/'}
            className="flex items-center gap-1.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
            <Home className="h-4 w-4" /> {isAuthed ? 'Player HQ' : 'Home'}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
